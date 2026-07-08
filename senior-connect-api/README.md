# Senior Connect API

Backend REST API for the **Senior Connect Platform** ("Activity Together") — serves the Mobile App and the Admin Dashboard. Built with **NestJS + TypeScript (strict) + PostgreSQL + TypeORM**, modular pattern.

Docs: [`../docs/SRS.md`](../docs/SRS.md) · [`../docs/ER-DIAGRAM.md`](../docs/ER-DIAGRAM.md) · Postman: [`../postman/Senior-Connect-API.postman_collection.json`](../postman/Senior-Connect-API.postman_collection.json)

## Quick start

```bash
# 1. Database (Docker Compose)
docker compose up -d          # starts Postgres 16 on port 5433 (see docker-compose.yml)

# 2. Install & configure
npm install
cp .env.example .env          # defaults match the container above

# 3. Seed (13 Figma categories + admin account)
npm run seed                  # admin@contenthub.io / admin123

# 4. Run
npm run start:dev             # http://localhost:5000/api/v1
```

OTP emails are logged to the console in dev (`[DEV] OTP for <email>: 123456`) unless `SMTP_*` env vars are configured.

## Module pattern

Every feature module under `src/modules/<name>/` contains:

| File | Responsibility |
|---|---|
| `<name>.module.ts` | Nest wiring |
| `<name>.controller.ts` | HTTP layer |
| `<name>.service.ts` | Business logic + repositories |
| `<name>.routes.ts` | Route path constants |
| `dto/*.dto.ts` | class-validator DTOs (barrel `dto/index.ts`) |
| `entities/*.entity.ts` | TypeORM entities (barrel `entities/index.ts`) |
| `interfaces/<name>.interface.ts` | TypeScript contracts |

Modules: `auth`, `users`, `categories`, `activities`, `participants`, `favorites`, `notifications`, `dashboard`, `uploads`.

## Conventions

- Response envelope: `{ success, message, data, meta? }`
- Auth: `Authorization: Bearer <accessToken>` (JWT), refresh via `POST /auth/refresh-token`
- Admin endpoints live under `/<module>/admin/...` and require `role = Admin`
- **Field names follow the Figma designs exactly** — see the dictionary in [`../CLAUDE.md`](../CLAUDE.md)
