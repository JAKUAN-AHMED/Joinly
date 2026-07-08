# Joinly — Activity Together

Joinly is a community activity platform: a mobile app where users discover, create, and join local activities, backed by an admin dashboard for managing users, approving activities, and running the platform.

This repository contains the **backend API** and the **admin dashboard** as a single monorepo.

## Repository layout

```
Joinly/
├── docs/
│   ├── SRS.md                  ← Software Requirements Specification
│   └── ER-DIAGRAM.md           ← Database entity-relationship diagram
├── postman/
│   └── Senior-Connect-API.postman_collection.json  ← full API collection, import into Postman
├── senior-connect-api/         ← NestJS + TypeORM + PostgreSQL backend
└── senior-connect-dashboard/   ← React + Vite + Redux Toolkit admin dashboard
```

## Tech stack

**Backend** (`senior-connect-api/`)
- NestJS 10, TypeScript (strict), TypeORM 0.3, PostgreSQL
- JWT auth (access + refresh tokens), email OTP verification
- Image uploads via Cloudinary
- Response envelope: `{ success, message, data, meta? }`

**Dashboard** (`senior-connect-dashboard/`)
- React + Vite + TypeScript
- Redux Toolkit + RTK Query for all API state
- Tailwind CSS

## Getting started

### 1. Backend

```bash
cd senior-connect-api
npm install
cp .env.example .env   # fill in DB credentials, JWT secrets, CLOUDINARY_URL, etc.
docker compose up -d   # starts PostgreSQL 16 on port 5433
npm run seed            # seeds the 13 base categories + an admin user
npm run start:dev
```

The API runs at `http://localhost:5000/api/v1`.

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run start:dev` | Run the API in dev mode (ts-node) |
| `npm run build` / `npm run start:prod` | Production build + run |
| `npm run seed` | Seed base categories + admin user |
| `npm run seed:demo` | Seed a full realistic demo dataset (users, activities, notifications) |
| `npm run typecheck` | TypeScript check with no emit |

Default seeded admin login: `admin@contenthub.io` / `admin123`.

### 2. Dashboard

```bash
cd senior-connect-dashboard
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173` and talks to the API at `http://localhost:5000/api/v1` by default (override with a `VITE_API_URL` env var).

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |

## API reference

Import `postman/Senior-Connect-API.postman_collection.json` into Postman for every endpoint with example requests/responses, organized by module (Auth, Users, Categories, Activities, Participants, Favorites, Notifications, Dashboard, Uploads).

## Docs

- [`docs/SRS.md`](docs/SRS.md) — full software requirements specification
- [`docs/ER-DIAGRAM.md`](docs/ER-DIAGRAM.md) — database schema as a Mermaid ER diagram
