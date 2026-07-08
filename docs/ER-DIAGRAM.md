# ER Diagram — Senior Connect Platform

Field names follow the Figma designs (camelCase in API, snake_case columns in PostgreSQL).
Render with any Mermaid viewer (GitHub, VS Code, mermaid.live).

```mermaid
erDiagram
    USERS ||--o{ ACTIVITIES : "organizes"
    USERS ||--o{ ACTIVITY_PARTICIPANTS : "joins"
    ACTIVITIES ||--o{ ACTIVITY_PARTICIPANTS : "has"
    USERS ||--o{ FAVORITES : "saves"
    ACTIVITIES ||--o{ FAVORITES : "saved as"
    USERS ||--o{ USER_INTERESTS : "selects"
    CATEGORIES ||--o{ USER_INTERESTS : "chosen in"
    CATEGORIES ||--o{ ACTIVITIES : "classifies"
    USERS ||--o{ OTPS : "receives"
    USERS ||--o{ BLOCKED_USERS : "blocks (blocker)"
    USERS ||--o{ BLOCKED_USERS : "blocked (blocked)"
    USERS ||--o{ NOTIFICATIONS : "sends (admin)"
    NOTIFICATIONS ||--o{ USER_NOTIFICATIONS : "delivered as"
    USERS ||--o{ USER_NOTIFICATIONS : "receives"

    USERS {
        uuid id PK
        varchar first_name "firstName"
        varchar last_name "lastName"
        varchar email UK "email"
        varchar password "bcrypt hash"
        varchar phone_number "phoneNumber"
        date date_of_birth "dateOfBirth"
        varchar language "language"
        varchar profile_photo "profilePhoto (URL)"
        varchar country "country"
        varchar region "region"
        varchar city "city"
        decimal latitude
        decimal longitude
        enum role "User | Admin"
        enum status "Pending | Active | Inactive | Suspended | Blocked"
        varchar date_format "dateFormat (MM/DD/YYYY)"
        boolean notification_sounds "notificationSounds"
        boolean allow_notifications "allowNotifications"
        boolean is_email_verified
        varchar refresh_token "hashed"
        timestamp created_at "memberSince"
        timestamp updated_at
    }

    OTPS {
        uuid id PK
        varchar email "target email"
        varchar otp_code "6 digits"
        enum type "VerifyEmail | ResetPassword"
        timestamp expires_at "5 min TTL"
        boolean is_used
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        varchar category_name UK "categoryName"
        varchar icon "icon (emoji/URL)"
        enum status "Active | Disabled"
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITIES {
        uuid id PK
        varchar activity_name "activityName"
        uuid category_id FK "categoryId"
        text descriptions "descriptions"
        int maximum_number_of_participants "maximumNumberOfParticipants"
        varchar activity_photo "activityPhoto (URL)"
        date activity_date "activityDate"
        time activity_time "activityTime"
        varchar activity_duration "activityDuration (e.g. 1 Hour)"
        varchar activity_equipment "activityEquipment"
        varchar activity_location "activityLocation"
        decimal latitude
        decimal longitude
        int min_age "minAge (Participant Age Range)"
        int max_age "maxAge (Participant Age Range)"
        decimal price "price (nullable)"
        enum difficulty "Beginner | Intermediate | Advanced"
        enum status "Draft | Pending | Approved | Rejected | Cancelled | Completed"
        varchar rejection_reason
        uuid organizer_id FK "organizerId"
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITY_PARTICIPANTS {
        uuid id PK
        uuid activity_id FK
        uuid user_id FK
        enum status "Joined | Cancelled"
        timestamp joined_at
    }

    FAVORITES {
        uuid id PK
        uuid user_id FK
        uuid activity_id FK
        timestamp created_at
    }

    USER_INTERESTS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
    }

    BLOCKED_USERS {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        varchar notification_title "notificationTitle"
        text message_content "messageContent"
        enum audience "Everyone | Seniors | Volunteers"
        enum status "Delivered | Failed"
        uuid sent_by FK "admin user"
        timestamp sent_date "sentDate"
    }

    USER_NOTIFICATIONS {
        uuid id PK
        uuid notification_id FK
        uuid user_id FK
        boolean is_read
        timestamp read_at
    }
```

## Constraint notes
- `users.email` unique; login for both mobile users and admins (`role` discriminates).
- `activity_participants (activity_id, user_id)` unique — a user joins an activity once.
- `favorites (user_id, activity_id)` unique.
- `user_interests (user_id, category_id)` unique.
- `blocked_users (blocker_id, blocked_id)` unique.
- Cascade delete: activity → participants/favorites; user → participants, favorites, interests, blocks, user_notifications.
- Counters shown in Figma are **derived**: `activityJoined` = count of `ACTIVITY_PARTICIPANTS` by user; `activityCreated` = count of `ACTIVITIES` by organizer; `activityCount` per category = count of `ACTIVITIES`; `connections` = distinct co-participants.
