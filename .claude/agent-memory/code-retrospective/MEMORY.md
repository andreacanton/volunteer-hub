# Code Retrospective Memory

## Project: volunteer-hub

### Architecture Conventions
- Feature-based modules under `webapi/src/modules/<feature>/`: `index.ts` (routes) + `service.ts` (pure logic)
- All API errors flow through `ApiError` class in `webapi/src/middleware/errorHandler.ts`
- Standard response shape enforced via `success()` / `error()` helpers in `webapi/src/utils/response.ts`
- TypeBox (`t`) used for all request/response validation — single source of truth

### Error Handling Pattern
- Business logic in service.ts should throw `ApiError` for domain errors (not raw DB errors)
- The global error handler in `errorHandler.ts` is a last-resort safety net, not the primary path
- SQLite UNIQUE constraint errors currently caught at the global handler level (trade-off: breadth vs precision)
- See `patterns.md` for detailed discussion of the constraint-handling trade-off

### Recurring Issues Found
- Missing `.env` file on fresh checkout — `.env.example` exists but no setup script copies it
- Migrations must be run manually before e2e tests; no `pretest` script enforces this
- The `test:e2e` root script does not set up prerequisites (env, migrations, browser install)
- Dynamic SQL builders using `Record<string, ...>` keys for column names — always check for allowlist; found in PR #16 `applyUserUpdate`
- `ApiErrorCode` constants in Flutter client lag behind backend `ErrorCode` additions — `AUTH_USER_EXISTS` missing in PR #16
- `ON DELETE CASCADE` FKs exist on `refresh_tokens` and `password_resets` (confirmed in migrations 003, 004) and `PRAGMA foreign_keys = ON` is set in `connection.ts` — manual child-row deletes in transactions are redundant

### Onboarding Gaps
- No `setup.sh` or `bun run setup` script at root level
- `CLAUDE.md` documents commands but not the first-run sequence
- Browser install (`bunx playwright install chromium`) is undocumented in root README/CLAUDE.md

### Test Design Observations
- E2E test uses `Date.now()` for unique test email — prevents collisions across runs, but not within a single parallel run if `beforeAll` races
- `registerTestUser` in `login.spec.ts` tolerates 409 correctly (line 21): idiomatic guard

### User Preferences
- No auto-commit unless explicitly asked
