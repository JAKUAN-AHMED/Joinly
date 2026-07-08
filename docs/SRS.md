# Software Requirements Specification (SRS)
## Senior Connect Platform — Backend API

| | |
|---|---|
| **Project** | Senior Connect Platform ("Activity Together") |
| **Document** | Software Requirements Specification v1.0 |
| **Date** | 2026-07-06 |
| **Clients** | Mobile App (iOS/Android), Admin Dashboard (Web) |
| **Backend** | NestJS (TypeScript), PostgreSQL, TypeORM |
| **Source of truth for UI/field names** | Figma: `Senior Connect - Mobile App.fig`, `Senior Connect - Admin Dashboard.fig` |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements of the Senior Connect backend REST API. The API serves two clients: a **mobile application** where community members discover, create, and join local activities, and an **admin dashboard** where administrators moderate the platform.

### 1.2 Scope
The backend provides:
- Account registration with email OTP verification, sign-in, password recovery.
- 3-step onboarding: location, interests, profile photo.
- Activity discovery (search, category filter, date/age/distance filters, map & list views).
- Activity lifecycle: create (draft → pending), admin approval/rejection, join/leave, upcoming/past.
- Favorites, user blocking, profile & app-preference management.
- Admin: dashboard statistics, user management (view/block/suspend), activity moderation, category management, broadcast notifications.

Out of scope: in-app payments ("Payments are not handled within the app" — per Figma), real-time chat, push-notification delivery infrastructure (only the data/API side is covered).

### 1.3 Definitions
| Term | Meaning |
|---|---|
| **Activity** | An event created by a user (organizer) that others can join. |
| **Organizer** | The user who created an activity. |
| **Participant** | A user who joined an activity. |
| **Category / Interest** | Classification of activities (Football, Cycling, Swimming, Golf, Basketball, Skiing, Climbing, Tennis, Table Tennis, Badminton, Handball, Boxing, Rowing…). A user's selected categories are their interests. |
| **OTP** | 6-digit one-time password sent by email, 5-minute validity. |
| **Audience** | Notification target group: `Everyone`, `Seniors`, `Volunteers`. |

### 1.4 References
- Figma designs in repository root (field-name dictionary in `CLAUDE.md`).
- ER diagram: `docs/ER-DIAGRAM.md`.
- Postman collection: `postman/Senior-Connect-API.postman_collection.json`.

---

## 2. Overall Description

### 2.1 User classes
| Class | Description |
|---|---|
| **User (mobile)** | Registers, onboards, discovers/creates/joins activities, manages profile. |
| **Admin (dashboard)** | Full moderation rights: users, activities, categories, notifications, statistics. |

### 2.2 Operating environment
- Node.js ≥ 20, NestJS 10, TypeScript 5 (strict).
- PostgreSQL ≥ 14 via TypeORM 0.3.
- Stateless JWT authentication; horizontal scaling possible.
- File uploads stored on local disk (`/uploads`), path returned as URL (swap-able for S3).

### 2.3 Design constraints
- **Field naming must match Figma labels** (camelCase) across DTOs, entities, and JSON responses — e.g. `descriptions`, `maximumNumberOfParticipants`, `activityLocation` (see dictionary in `CLAUDE.md`).
- Modular architecture: each module contains `controller`, `service`, `routes`, `validation`, `model`, `interface` files.
- Uniform response envelope: `{ success, message, data, meta? }`.

---

## 3. Functional Requirements

### 3.1 Authentication module (`auth`) — FR-A

| ID | Requirement |
|---|---|
| FR-A1 | **Register** — `POST /auth/register` with `firstName`, `lastName`, `email`, `password`, `phoneNumber`, `dateOfBirth`, `language`, acceptance of Terms & Conditions. Creates user in `Pending` status and emails a 6-digit OTP. |
| FR-A2 | **OTP verification** — `POST /auth/verify-otp` with `email`, `otpCode`. On success the account becomes `Active` and tokens are issued. |
| FR-A3 | **Resend OTP** — `POST /auth/resend-otp` ("Didn't get the code?"). Rate-limited to 1/min. |
| FR-A4 | **Sign in** — `POST /auth/login` with `email`, `password` ("Welcome Back / Sign in to access your account"). Returns `accessToken`, `refreshToken`, and profile. Blocked/suspended users are refused. |
| FR-A5 | **Forgot password** — `POST /auth/forgot-password` with `email`; sends OTP ("Enter your email address to reset your password."). |
| FR-A6 | **Reset password** — `POST /auth/reset-password` with `email`, `otpCode`, `newPassword`, `confirmPassword`. Password rule: 6–8 characters (per Figma "Password must have 6-8 characters."). |
| FR-A7 | **Change password** — `POST /auth/change-password` (authenticated) with `currentPassword`, `newPassword`, `confirmPassword`. |
| FR-A8 | **Refresh token** — `POST /auth/refresh-token`. |
| FR-A9 | **Logout** — `POST /auth/logout` (invalidates refresh token). |
| FR-A10 | **Admin login** — `POST /auth/admin/login` with `email`, `password`, `rememberMe`. Only `role = Admin`. |

### 3.2 Users module (`users`) — FR-U

| ID | Requirement |
|---|---|
| FR-U1 | **Onboarding step 1 — location** (`1 of 3`): `PATCH /users/me/location` with either GPS (`latitude`, `longitude`) or manual `country`, `region`, `city`. |
| FR-U2 | **Onboarding step 2 — interests** (`2 of 3`): `PATCH /users/me/interests` with `categoryIds[]`; minimum 3 unless skipped ("Select at least 3 interests." / "Skip for now"). |
| FR-U3 | **Onboarding step 3 — profile photo** (`3 of 3`): `PATCH /users/me/profile-photo` with `profilePhoto` (uploaded file URL); skippable. |
| FR-U4 | **Get my profile** — `GET /users/me`: returns profile + `memberSince`, `activityJoined`, `activityCreated`, `connections` counters and interests. |
| FR-U5 | **Edit profile** — `PATCH /users/me` with `firstName`, `lastName`, `phoneNumber`, `dateOfBirth`. |
| FR-U6 | **App preferences** — `PATCH /users/me/app-preferences` with `language`, `dateFormat`, `notificationSounds`, `allowNotifications`. |
| FR-U7 | **Block / unblock a user** — `POST /users/{userId}/block`, `DELETE /users/{userId}/block`. Blocked users' activities are hidden from the blocker. |
| FR-U8 | **Admin: list users** — `GET /users/admin/users` with pagination, `search` (name, email or country), `status` filter, tabs All/Active/Blocked. Columns: user profile, `email`, `country`, `activities` count, `status`. |
| FR-U9 | **Admin: user details** — `GET /users/admin/users/{userId}`: profile, `memberSince`, `phoneNumber`, account status, interests, `activitiesJoined`, `activitiesCreated`, joined & created activity histories. |
| FR-U10 | **Admin: change user status** — `PATCH /users/admin/users/{userId}/status` (`Active`/`Inactive`/`Suspended`/`Blocked` — "Block user"). |

### 3.3 Categories module (`categories`) — FR-C

| ID | Requirement |
|---|---|
| FR-C1 | **List categories** — `GET /categories` (mobile chips & interest picker; only `Active` for non-admins). |
| FR-C2 | **Admin: create** — `POST /categories/admin/categories` with `categoryName`, `icon`. |
| FR-C3 | **Admin: list with stats** — `GET /categories/admin/categories`: `icon`, `categoryName`, `activityCount`, `status`, paginated; header stats `totalCategories`, `activeNow`. |
| FR-C4 | **Admin: update / disable / delete** — `PATCH` & `DELETE /categories/admin/categories/{id}` (status `Active`/`Disabled`). |
| FR-C5 | Users may propose a new category inline while creating an activity ("Add Category name") → created as `Disabled` pending admin review. |

### 3.4 Activities module (`activities`) — FR-AC

| ID | Requirement |
|---|---|
| FR-AC1 | **Create activity** — `POST /activities` with `activityName`, `categoryId` (or `categoryName` for a new one), `descriptions`, `maximumNumberOfParticipants`, `activityPhoto`, `activityDate`, `activityTime`, `activityDuration`, `activityEquipment` (optional), `activityLocation` (+ `latitude`/`longitude`), `minAge`, `maxAge`, `price` (optional), `difficulty`. Created as `Pending` (or `Draft` when `saveAsDraft = true`). |
| FR-AC2 | **Discover / list** — `GET /activities` with `search`, `categoryId`, `activityDate`, `minAge`/`maxAge`, `maxDistance` (km, from user location), `latitude`/`longitude`, pagination. Only `Approved` upcoming activities; excludes blocked users' activities. Supports `view=map` (returns coordinates) and list view. |
| FR-AC3 | **Featured this weekend** — `GET /activities/featured` (approved activities dated within the coming weekend). |
| FR-AC4 | **Activity details** — `GET /activities/{id}`: full card per Figma — category, `activityName`, date & time, `activityLocation` + distance, participants `joined/maximumNumberOfParticipants` + avatars, `descriptions` ("About this activity"), practical info (`difficulty`, `activityEquipment`, `organizer`, `activityDuration`, age limit, `price`), and `isJoined`/`isFavorite` flags. |
| FR-AC5 | **My activities** — `GET /activities/my-activities` with tabs `All`/`Upcoming`/`Past` ("My Activities"). |
| FR-AC6 | **Joined activities** — `GET /activities/joined-activities` with the same tabs. |
| FR-AC7 | **Update / cancel own activity** — `PATCH /activities/{id}`, `DELETE /activities/{id}` (only organizer; edits to approved activities return to `Pending`). |
| FR-AC8 | **Admin: moderation list** — `GET /activities/admin/activities` with tabs `Pending`/`Approved`/`Rejected`, category filter, date filter, search, pagination. |
| FR-AC9 | **Admin: approve / reject** — `PATCH /activities/admin/activities/{id}/status` with `status` (`Approved`/`Rejected`) and optional `rejectionReason`. |
| FR-AC10 | **Admin: details & delete** — `GET`/`DELETE /activities/admin/activities/{id}` (details page incl. organizer info; "View Organizer Profile"). |

### 3.5 Participants module (`participants`) — FR-P

| ID | Requirement |
|---|---|
| FR-P1 | **Join** — `POST /participants/activities/{activityId}/join`. Refused when full (`maximumNumberOfParticipants`), age limits violated, already joined, or activity not `Approved`. Response confirms "You're going!". |
| FR-P2 | **Leave** — `DELETE /participants/activities/{activityId}/leave`. |
| FR-P3 | **List participants** — `GET /participants/activities/{activityId}/participants`: name, country, age, joined date (participant profile view supports Block). |

### 3.6 Favorites module (`favorites`) — FR-F

| ID | Requirement |
|---|---|
| FR-F1 | **Add favorite** — `POST /favorites/activities/{activityId}`. |
| FR-F2 | **Remove favorite** — `DELETE /favorites/activities/{activityId}`. |
| FR-F3 | **List favorites** — `GET /favorites` ("Favorite Activities — View and manage favorite Activity"). |

### 3.7 Notifications module (`notifications`) — FR-N

| ID | Requirement |
|---|---|
| FR-N1 | **Admin: compose & send** — `POST /notifications/admin/notifications` with `notificationTitle`, `messageContent`, `audience` (`Everyone`/`Seniors`/`Volunteers`). Status recorded as `Delivered` or `Failed`. |
| FR-N2 | **Admin: history** — `GET /notifications/admin/notifications`: subject, audience, `sentDate`, `status`, paginated. |
| FR-N3 | **Mobile: my notifications** — `GET /notifications` (notifications targeted at the user's audience) and `PATCH /notifications/{id}/read`. |

### 3.8 Dashboard module (`dashboard`) — FR-D (admin only)

| ID | Requirement |
|---|---|
| FR-D1 | **Statistics** — `GET /dashboard/statistics`: `totalUsers`, `totalActivities`, `totalRegistrations`, `pendingApprovals`. |
| FR-D2 | **Category distribution** — `GET /dashboard/category-distribution`: percentage of activities per category. |
| FR-D3 | **Recent users** — `GET /dashboard/recent-users` (last 24 h): user, type, `dateJoined`, `status`. |
| FR-D4 | **Recent activities** — `GET /dashboard/recent-activities`: `activityName`, location, category. |

### 3.9 Uploads module (`uploads`) — FR-UP

| ID | Requirement |
|---|---|
| FR-UP1 | `POST /uploads` (multipart, field `file`) → `{ url }`; images only (jpg/png/webp), ≤ 5 MB. Used for `profilePhoto` and `activityPhoto` ("Upload files / Browse Files"). |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Security | Passwords bcrypt (cost 10). JWT access 1 d / refresh 30 d. Role guard for admin routes. OTPs hashed-comparable, single-use, 5-min expiry. |
| NFR-2 | Security | Input validation on every endpoint (class-validator, whitelist). SQL injection prevented by TypeORM parameterization. |
| NFR-3 | Performance | List endpoints paginated (default `limit=10`), indexed columns for search/filter (email, status, activityDate, categoryId). p95 < 300 ms at 100 RPS. |
| NFR-4 | Availability | Stateless API; readiness probe `GET /health`. |
| NFR-5 | Consistency | Uniform envelope `{ success, message, data, meta? }`; errors `{ success:false, message, errors? }` with proper HTTP codes. |
| NFR-6 | Maintainability | Strict TypeScript; modular pattern (controller/service/routes/validation/model/interface per module); env-driven config. |
| NFR-7 | Data integrity | FKs with `ON DELETE CASCADE` for dependent rows (participants, favorites, interests); unique constraints on `email`, `(userId, activityId)` pairs. |
| NFR-8 | i18n-readiness | `language` and `dateFormat` stored per user; API returns ISO dates, clients format. |

---

## 5. API conventions

- Base URL: `http://<host>:5000/api/v1`
- Auth: `Authorization: Bearer <accessToken>`
- Pagination query: `page` (1-based), `limit`; response `meta: { page, limit, total, totalPages }`
- Dates: ISO-8601 (`activityDate: "2026-07-12"`, `activityTime: "10:00"`)
- Errors: `400` validation, `401` unauthenticated, `403` forbidden/role, `404` not found, `409` conflict (duplicate email, already joined, full activity)

## 6. Acceptance criteria
1. `npm run build` passes with strict TypeScript.
2. All endpoints in §3 exist and enforce the stated rules.
3. Field names in requests/responses exactly match the Figma dictionary in `CLAUDE.md`.
4. Postman collection contains every endpoint with request body and example response.
