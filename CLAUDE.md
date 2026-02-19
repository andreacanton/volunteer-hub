# CLAUDE.md

## Project Overview

Volunteer Attendance Management - a full-stack application for coordinating charity volunteer services. Volunteers subscribe to service shifts (Evening, Breakfast, Cooks, Logistics) on specific days, set attendance status, and coordinators manage staffing levels.

## Technology Stack

- **Backend**: Bun.js + Elysia (TypeScript), SQLite with bun:sqlite
- **Frontend**: Flutter (Dart) - Web only
- **Auth**: JWT tokens (HS256, 24h expiration)
- **API**: RESTful with `/api/v1/` prefix
- **Logging**: LogTape (@logtape/logtape)
- **E2E**: bun + playwright e2e
- **API testing**: bruno .vscode/bruno-collections

## Project Structure

```
webapi/            # Bun.js + Elysia API
  src/
    modules/       # Feature-based modules (auth/, user/, health/, etc.)
      <module>/
        index.ts   # Elysia instance with routes (controller)
        service.ts # Business logic (pure functions)
    middleware/    # Auth guard, error handler, request logger
    config/        # Environment validation, logger setup, CORS
    database/      # Connection singleton, init, migrations
    utils/         # Response helpers, shared utilities
    types/         # Shared TypeScript types
    constants/     # Enums and constants
    app.ts         # Main Elysia app assembly
    index.ts       # Entry point
  migrations/      # SQL migration files (001_*.sql, 002_*.sql)
  database/        # SQLite database files (.gitignored)
  tests/

ui/                # Flutter web app
  lib/
    models/        # Data models
    services/      # API client (dio)
    providers/     # State management
    screens/       # UI screens
    widgets/       # Reusable widgets
  tests/

e2e/               # Playwright E2E tests (Bun + @playwright/test)
  tests/           # Test specs
  playwright.config.ts
```

## Backend Architecture Patterns

### Elysia Conventions
- **Feature-based modules**: Group routes, services by feature (not by layer)
- **Elysia instance as controller**: Each module exports an Elysia instance with routes
- **Method chaining**: Always chain route definitions (`.get().post().use()`)
- **TypeBox for validation**: Use Elysia's `t` for request/response schemas (single source of truth)
- **Decoupled services**: Business logic in pure functions/static methods, no Elysia context dependency
- **Explicit extensions**: All imports must use `.ts` extension for Bun compatibility

### Standard API Response Format
```typescript
{
  success: boolean,
  data: T | null,
  error: { code: string, message: string, details?: object } | null,
  timestamp: string  // ISO 8601
}
```

### Error Codes
| Code                     | HTTP | Description                          |
| ------------------------ | ---- | ------------------------------------ |
| VALIDATION_ERROR         | 400  | Invalid request data                 |
| AUTH_TOKEN_MISSING       | 401  | No Authorization header              |
| AUTH_TOKEN_INVALID       | 401  | Malformed or invalid token           |
| AUTH_TOKEN_EXPIRED       | 401  | Token past expiration                |
| AUTH_TOKEN_REVOKED       | 401  | Token has been revoked               |
| AUTH_INVALID_CREDENTIALS | 401  | Email/password combination incorrect |
| AUTH_USER_NOT_FOUND      | 404  | Authenticated user no longer exists  |
| AUTH_USER_EXISTS         | 409  | Email already registered             |
| RESOURCE_NOT_FOUND       | 404  | Entity not found                     |
| DATABASE_ERROR           | 500  | Database operation failed            |
| INTERNAL_ERROR           | 500  | Unexpected server error              |

### Key Dependencies
- `elysia` - Web framework
- `@elysiajs/jwt` - JWT authentication plugin
- `@elysiajs/cors` - CORS handling
- `@logtape/logtape` - Structured logging with hierarchical categories
- `bun:sqlite` - Native SQLite driver (built-in)
- `Bun.password` - Password hashing (built-in)

## Environment Variables

Required in `webapi/.env`:
```
JWT_SECRET=<min 32 chars>
```

Optional (with defaults):
```
PORT=3000
NODE_ENV=development
JWT_EXPIRES_IN=24h
DATABASE_PATH=./database/volunteer-hub.db
LOG_LEVEL=info  # trace|debug|info|warning|error|fatal
```

## Common Commands

### Root (from project root)
```bash
bun run test:webapi  # Run backend tests
bun run test:ui      # Run Flutter tests
bun run test:e2e     # Run Playwright E2E tests
bun run test         # Run all tests (webapi + ui + e2e)
bun run test:bruno        # Run all Bruno API tests
bun run test:bruno:health # Run Bruno health tests
bun run test:bruno:auth   # Run Bruno auth tests
bun run test:bruno:user   # Run Bruno user tests
bun run seed:test         # Seed test users for Bruno tests
```

### Backend (webapi/)
```bash
cd webapi
bun install          # Install dependencies
bun run dev          # Start dev server with hot reload
bun run migrate      # Run database migrations
bun run build        # Build for production
bun run start        # Start production server
bun test             # Run tests
bun run lint         # Run ESLint
```

**Note**: `bun run dev` uses hot reload - no need to restart the server after code changes. Just edit and test directly.

### Frontend (ui/)
```bash
cd ui
flutter pub get      # Get dependencies
flutter run -d chrome  # Run in Chrome browser
flutter test         # Run tests
```

### E2E Tests (e2e/)
```bash
cd e2e
bun install                        # Install dependencies
bunx playwright install --with-deps chromium  # Install browsers
bunx playwright test               # Run all tests (all browsers)
bunx playwright test --project=chromium  # Run chromium only
bun run test:ui                    # Interactive UI mode
bun run report                     # View last HTML report
```

**Note**: The Playwright config includes `webServer` entries that auto-start the backend (port 3000) and Flutter frontend (port 8080) if they aren't already running. During local dev, existing servers are reused.

## Data Model

Core entities: User (volunteer), Service (type), DayOfWeek, ServiceGroup (Service + Day + Coordinator), Subscription (volunteer to ServiceGroup), Attendance (status per date).

User roles: VOLUNTEER, COORDINATOR (per ServiceGroup), ADMIN (system-wide).



