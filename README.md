# Perion — Permission-Based UI Management System

NestJS + Vue 3 technical assessment. Full-stack RBAC system with cookie-based auth, Redis session store, and PostgreSQL.

---

## Quick Start

```bash
docker-compose up --build
```

Open **http://localhost** in your browser.

> **Note:** The first run takes ~60–90 seconds for the DB to initialize and migrations to run.

Pre-seeded users (no passwords — just select from the login screen):

| Name  | Email                | Role   |
|-------|----------------------|--------|
| Admin | admin@test.com       | Admin  |
| Editor| editor@test.com      | Editor |
| Viewer| viewer@test.com      | Viewer |

---

## Local Development

**Prerequisites:** Node 20+, PostgreSQL 15, Redis 7

### Backend

```bash
cd backend
cp .env.example .env   # edit DB/Redis credentials
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend proxies `/api` to `http://localhost:3000` via Vite — no CORS issues.

### Tests

```bash
# Backend (32 tests — Jest + pg-mem)
cd backend && npm test

# Frontend (9 tests — Vitest + Vue Test Utils)
cd frontend && npx vitest run
```

---

## Architecture

### Backend — NestJS (Express adapter)

```
src/
├── auth/          # Session-based auth (express-session + connect-redis)
├── users/         # User CRUD, DTOs, TypeORM entity
├── roles/         # Role CRUD, permission management
├── common/
│   ├── enums/     # Integer Permission enum (USER_VIEW=1000, …)
│   ├── guards/    # PermissionsGuard
│   ├── decorators/# @CheckPermissions()
│   ├── filters/   # GlobalExceptionFilter
│   └── types/     # ApiResponse<T> wrapper
└── database/
    ├── migrations/ # Schema + seeding (TypeORM)
    └── factories/  # Test data factories
```

**Key decisions:**

- **Integer permissions stored in DB, dot-notation strings on the wire.** `USER_VIEW = 1000` is stored in `role_permissions.code`. The API maps it to `"user.view"` before sending to the frontend. The frontend never sees raw integers.

- **Redis permission cache with TypeORM Subscriber invalidation.** Each authenticated API call reads permissions from Redis (key: `perms:{userId}`). The `RolePermissionSubscriber` clears affected cache entries whenever roles or permissions change — zero stale permission bugs without polling.

- **pg-mem for integration tests.** All integration tests run against an in-memory PostgreSQL emulator. No Docker, no test database, ~1s for all 32 tests.

- **Cookie-based sessions — no JWT.** `express-session` + `connect-redis`, `HttpOnly`, `SameSite: strict`. Frontend uses Axios `withCredentials: true`. No `localStorage`.

- **Graceful shutdown.** NestJS `enableShutdownHooks()` handles `SIGTERM`/`SIGINT` — connections close before process exit.

### Frontend — Vue 3

```
src/
├── components/
│   ├── layout/    # AppLayout, AppSidebar, AppHeader
│   └── ui/        # Can.vue (permission wrapper)
├── composables/   # usePermissions()
├── stores/        # Pinia: auth, users, roles
├── views/         # LoginView, UsersView, RolesView
├── router/        # Vue Router (session restore in beforeEach)
└── types/         # API type definitions
```

**Key decisions:**

- **`<Can permission="user.create">` wrapper component.** Replaces scattered `v-if="can('...')"` calls. Slot-based, zero DOM overhead when hidden.

- **Vite proxy for same-origin cookies.** `/api` proxied to `http://localhost:3000` during dev. In Docker, nginx does the same. This avoids cross-origin cookie headaches entirely.

- **Admin role is protected in both layers.** Backend `RolesService` throws `BadRequestException` on permission edit or delete attempts against "Admin". Frontend hides edit controls and shows "View" instead of "Edit" for Admin — defense in depth.

- **Tailwind v4 with `@tailwindcss/vite`.** No `tailwind.config.js` — configuration lives in CSS via `@theme {}`. Manrope font, Material Symbols Outlined icons.

### Docker Architecture

```
Browser → nginx:80
              ├── /         → serve /dist (Vue build)
              └── /api/     → proxy → backend:3000
                                          ├── db (PostgreSQL)
                                          └── redis
```

Single entry point at port 80. No CORS. Cookie `SameSite: strict` works correctly because frontend and backend share the same origin from the browser's perspective.

---

## API Reference

All responses follow `ApiResponse<T>`:
```json
{ "success": true, "data": {}, "message": "...", "errors": null }
```

| Method | Endpoint          | Permission       |
|--------|-------------------|------------------|
| GET    | /api/auth/me      | authenticated    |
| POST   | /api/auth/select  | —                |
| POST   | /api/auth/logout  | authenticated    |
| GET    | /api/users        | user.view        |
| POST   | /api/users        | user.create      |
| PUT    | /api/users/:id    | user.edit        |
| DELETE | /api/users/:id    | user.delete      |
| GET    | /api/roles        | role.view        |
| POST   | /api/roles        | role.edit        |
| PUT    | /api/roles/:id    | role.edit        |
| DELETE | /api/roles/:id    | role.edit        |

---

## Permission Matrix

| Permission    | Admin | Editor | Viewer |
|---------------|-------|--------|--------|
| user.view     | ✓     | ✓      | ✓      |
| user.create   | ✓     |        |        |
| user.edit     | ✓     | ✓      |        |
| user.delete   | ✓     |        |        |
| role.view     | ✓     | ✓      |        |
| role.edit     | ✓     |        |        |

---

## Tests

### Backend (32 tests)

| Suite | Tests | Strategy |
|-------|-------|----------|
| AuthService | 8 | pg-mem integration |
| UsersService | 11 | pg-mem integration |
| RolesService | 7 | pg-mem integration |
| PermissionsGuard | 6 | unit (mocked) |

### Frontend (9 tests)

| Suite | Tests | Strategy |
|-------|-------|----------|
| usePermissions | 4 | composable unit |
| Can.vue | 5 | Vue Test Utils |
