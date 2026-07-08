# Senior Connect Platform — Backend API

## What this project is
Backend REST API (NestJS + TypeScript + PostgreSQL/TypeORM) for the **Senior Connect / Activity Together** platform:
- **Mobile App** (Figma: `Senior Connect - Mobile App.fig`) — users discover, create, and join local activities.
- **Admin Dashboard** (Figma: `Senior Connect - Admin Dashboard.fig`) — admins manage users, approve activities, manage categories, and send notifications.

## Repository layout
```
giova_cass/
├── CLAUDE.md                  ← this file
├── docs/
│   ├── SRS.md                 ← Software Requirements Specification
│   └── ER-DIAGRAM.md          ← Mermaid ER diagram
├── postman/
│   └── Senior-Connect-API.postman_collection.json
├── *.fig                      ← Figma source designs (source of truth for field names)
├── senior-connect-api/        ← NestJS backend
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/            ← typeorm + app config
│       ├── common/            ← guards, decorators, filters, interceptors, enums, utils
│       └── modules/<name>/    ← one folder per feature module
└── senior-connect-dashboard/  ← React admin dashboard (Vite + TS + Redux Toolkit/RTK Query)
```

## Backend module pattern (MANDATORY — NestJS-standard layout, every feature module)
```
src/modules/<module>/
├── <module>.module.ts         ← Nest module wiring
├── <module>.controller.ts     ← HTTP layer only (no business logic)
├── <module>.service.ts        ← business logic + TypeORM repository access
├── <module>.routes.ts         ← route path constants (single source for URLs)
├── dto/                       ← class-validator DTOs, one class per file + index.ts barrel
│   ├── <action>.dto.ts
│   └── index.ts
├── entities/                  ← TypeORM entities, one class per file + index.ts barrel
│   ├── <name>.entity.ts
│   └── index.ts
└── interfaces/                ← TypeScript interfaces (service contracts, responses)
    └── <module>.interface.ts
```
Modules: `auth`, `users`, `categories`, `activities`, `participants`, `favorites`, `notifications`, `dashboard`, `uploads`.
`uploads` has no entities (files live on disk); its filter/limits constants live in `uploads.constants.ts` (Nest CLI would normally call this `dto`, but there's no request body to validate here).
Import DTOs/entities via the barrel: `from './dto'`, `from './entities'`, cross-module `from '../categories/entities'`.
TypeORM `entities:` glob in `config/typeorm.config.ts` points at `modules/**/entities/*.entity.{ts,js}`.

## Field naming — FIGMA IS THE SOURCE OF TRUTH (must)
Every API/DTO/entity field name is the camelCase form of the label in the Figma designs.
Do NOT rename or "improve" them. Canonical dictionary:

| Figma label | Field name |
|---|---|
| First Name | `firstName` |
| Last Name | `lastName` |
| Your Email / Email Address | `email` |
| Password | `password` |
| Phone number | `phoneNumber` |
| Date of birth | `dateOfBirth` |
| Language | `language` |
| Country / Region / City | `country` / `region` / `city` |
| Profile Photo | `profilePhoto` |
| What are you doing? (Activity name) | `activityName` |
| Category / Category name | `categoryName` (entity), `categoryId` (FK) — no icon field, name only |
| Descriptions | `descriptions` (plural — as in Figma) |
| Maximum number of participants | `maximumNumberOfParticipants` |
| Activity Photo | `activityPhoto` |
| Activity Date | `activityDate` |
| Activity Time | `activityTime` |
| Activity Duration | `activityDuration` |
| Activity Equipment | `activityEquipment` |
| Activity Location | `activityLocation` |
| Participant Age Range | `minAge` / `maxAge` (range bounds) |
| Price | `price` |
| Difficulty | `difficulty` |
| Organizer | `organizer` (relation), `organizerId` |
| Notification Title | `notificationTitle` |
| Message Content | `messageContent` |
| Audience | `audience` (`Everyone` \| `Seniors` \| `Volunteers`) |
| Sent Date | `sentDate` |
| Current/New/Confirm Password | `currentPassword` / `newPassword` / `confirmPassword` |
| Date Format | `dateFormat` |
| Notification Sounds | `notificationSounds` |
| Member since | `memberSince` (users.createdAt exposed as memberSince) |
| Status values (user) | `Active` \| `Inactive` \| `Suspended` \| `Blocked` \| `Pending` |
| Status values (activity) | `Draft` \| `Pending` \| `Approved` \| `Rejected` \| `Cancelled` \| `Completed` |
| Status values (category) | `Active` \| `Disabled` |
| Status values (notification) | `Delivered` \| `Failed` |

## Conventions
- **TypeScript strict**, Node ≥ 20, NestJS 10, TypeORM 0.3, PostgreSQL.
- Global prefix `api/v1`. Mobile endpoints under module root; admin-only endpoints under `/admin/...` inside the same module or protected with `@Roles(UserRole.ADMIN)`.
- Response envelope everywhere: `{ "success": boolean, "message": string, "data": ... }` (+ `meta` for paginated lists: `{ page, limit, total, totalPages }`).
- Auth: JWT access (`Authorization: Bearer`) + refresh token; passwords bcrypt-hashed; email OTP for verification/reset (6 digits, 5 min TTL).
- Validation via `class-validator` DTOs in `<module>/dto/*.dto.ts` with global `ValidationPipe({ whitelist: true, transform: true })`.
- DB naming: snake_case tables/columns via TypeORM column names declared explicitly; API surface stays camelCase.
- Env config in `.env` (see `.env.example`). Never commit `.env`.

## Commands
```bash
cd senior-connect-api
npm install
npm run build         # tsc (strict) → dist/
npm run seed          # creates 13 Figma categories + admin (admin@contenthub.io / admin123)
npm run start:dev     # ts-node
npm run start:prod    # node dist/main.js
```

## Database (dev)
Postgres runs via **Docker Compose** (`senior-connect-api/docker-compose.yml`) — the host's native Postgres 18 on 5432 has unknown credentials, do not use it:
```bash
cd senior-connect-api
docker compose up -d       # starts Postgres 16 in container "senior-connect-db" on port 5433
docker compose ps          # check health
docker compose down        # stop (add -v to also wipe the data volume)
```
Reads `DB_USERNAME`/`DB_PASSWORD`/`DB_DATABASE`/`DB_PORT` from `.env` (defaults: `postgres`/`postgres`/`senior_connect`/`5433`). Data persists in the named volume `senior-connect-db-data` across restarts.
`.env`: `postgres://postgres:postgres@localhost:5433/senior_connect`, `DB_SYNCHRONIZE=true` auto-creates schema (use migrations for prod).

## Gotchas learned in this repo
- TypeORM QueryBuilder strings must use **property names** (`activity.activityDate`), not column names (`activity.activity_date`) — otherwise `Cannot read properties of undefined (reading 'databaseName')`.
- Nullable union-typed columns (`string | null`) need an explicit `type:` in `@Column`, or Postgres driver throws `Data type "Object" is not supported`.
- `process.env` is read at decorator-evaluation time in `app.module.ts`, so `main.ts` starts with `import 'dotenv/config'`.
- Dev OTPs are not emailed unless SMTP_* is set — they are logged to the server console (`[DEV] OTP for <email>`).

## Postman
`postman/Senior-Connect-API.postman_collection.json` — import into Postman. Contains every endpoint with request body + example response, organized by module. `{{baseUrl}}` = `http://localhost:5000/api/v1`, `{{accessToken}}` auto-captured by login request test script.
