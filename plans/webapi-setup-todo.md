# webapi-setup-todo.md

## Metadata
- Feature: Initial Web API Setup - Volunteer Attendance Management Backend
- Plan Source: plans/webapi-setup-plan.md
- Service/Repo: volunteer-hub/webapi
- Date: 2026-01-22
- Owner/Reviewer: TBD
- Links: README.md, CLAUDE.md

## Phases

### Phase 1: Project Initialization (Goal: Create Bun project with dependencies)
- [x] T1.1: Initialize Bun project (Complexity: Simple)
  - Description: Create webapi directory and initialize with `bun init`
  - Dependencies: none
  - Acceptance: package.json exists with project metadata
  - Notes: Entry point should be src/index.ts

- [x] T1.2: Install core dependencies (Complexity: Simple)
  - Description: Install elysia, @elysiajs/jwt, @elysiajs/cors, @logtape/logtape
  - Dependencies: T1.1
  - Acceptance: Dependencies listed in package.json

- [x] T1.3: Install dev dependencies (Complexity: Simple)
  - Description: Install typescript, @types/bun, eslint, prettier, vitest
  - Dependencies: T1.1
  - Acceptance: devDependencies listed in package.json

- [x] T1.4: Create TypeScript configuration (Complexity: Simple)
  - Description: Create tsconfig.json with strict mode enabled
  - Dependencies: T1.1
  - Acceptance: tsconfig.json compiles without errors

- [x] T1.5: Create ESLint and Prettier configuration (Complexity: Simple)
  - Description: Create .eslintrc.js and .prettierrc with standardized config
  - Dependencies: T1.3
  - Acceptance: `bun run lint` passes

- [x] T1.6: Create .gitignore (Complexity: Simple)
  - Description: Add ignores for node_modules, .env, database files
  - Dependencies: T1.1
  - Acceptance: Sensitive files excluded from git

### Phase 2: Folder Structure Setup (Goal: Establish feature-based architecture)
- [x] T2.1: Create src directory with entry point (Complexity: Simple)
  - Description: Create webapi/src/index.ts with placeholder
  - Dependencies: T1.4
  - Acceptance: File exists with placeholder code

- [x] T2.2: Create modules directory structure (Complexity: Simple)
  - Description: Create modules/auth, modules/user, modules/health with index.ts files
  - Dependencies: T2.1
  - Acceptance: Directories exist with placeholder index.ts files

- [x] T2.3: Create shared utilities directories (Complexity: Simple)
  - Description: Create utils/, types/, constants/ directories
  - Dependencies: T2.1
  - Acceptance: Directories exist

- [x] T2.4: Create middleware directory (Complexity: Simple)
  - Description: Create middleware/ directory
  - Dependencies: T2.1
  - Acceptance: Directory exists

- [x] T2.5: Create database directory structure (Complexity: Simple)
  - Description: Create src/database/, database/, migrations/ directories
  - Dependencies: T2.1
  - Acceptance: Directories exist

- [x] T2.6: Create tests directory structure (Complexity: Simple)
  - Description: Create tests/ directory with sample test file
  - Dependencies: T2.1
  - Acceptance: Directory exists with sample test

### Phase 3: Environment Configuration (Goal: Secure and validate configuration)
- [ ] T3.1: Create .env.example (Complexity: Simple)
  - Description: Document all required environment variables with descriptions
  - Dependencies: T1.6
  - Acceptance: File lists all env vars (JWT_SECRET, PORT, NODE_ENV, etc.)

- [ ] T3.2: Create environment validation module (Complexity: Medium)
  - Description: Create src/config/env.ts using TypeBox schema for validation
  - Dependencies: T2.3
  - Acceptance: Exports validated config object, fails on missing JWT_SECRET

- [ ] T3.3: Create config index (Complexity: Simple)
  - Description: Create src/config/index.ts that exports typed configuration
  - Dependencies: T3.2
  - Acceptance: `import { config } from './config'` works

- [ ] T3.4: Create LogTape configuration (Complexity: Medium)
  - Description: Create src/config/logger.ts with console sink and hierarchical categories
  - Dependencies: T3.2
  - Acceptance: `configureLogging()` function exported and working

### Phase 4: Database Setup (Goal: Initialize SQLite with bun:sqlite)
- [ ] T4.1: Create database connection singleton (Complexity: Medium)
  - Description: Create src/database/connection.ts with getDb() function
  - Dependencies: T3.3
  - Acceptance: Exports working getDb() function

- [ ] T4.2: Create database initialization logic (Complexity: Medium)
  - Description: Create src/database/init.ts with directory creation and WAL mode
  - Dependencies: T4.1
  - Acceptance: Database file created on startup, WAL mode enabled

- [ ] T4.3: Create migration runner scaffold (Complexity: Medium)
  - Description: Create src/database/migrate.ts to read and execute SQL files
  - Dependencies: T4.1
  - Acceptance: `bun run migrate` executes without error

- [ ] T4.4: Create initial migration (Complexity: Simple)
  - Description: Create migrations/001_init_migrations.sql for schema_migrations table
  - Dependencies: T4.3
  - Acceptance: Migration table created after running migrate

- [ ] T4.5: Create database index export (Complexity: Simple)
  - Description: Create src/database/index.ts for clean imports
  - Dependencies: T4.1, T4.2
  - Acceptance: Clean import from database module works

### Phase 5: Core Middleware (Goal: Implement authentication and error handling)
- [ ] T5.1: Create standardized API response helpers (Complexity: Simple)
  - Description: Create src/utils/response.ts with success() and error() helpers
  - Dependencies: T2.3
  - Acceptance: Helpers return correct JSON structure with timestamp

- [ ] T5.2: Create error handler middleware (Complexity: Medium)
  - Description: Create src/middleware/errorHandler.ts to catch and format errors
  - Dependencies: T5.1
  - Acceptance: All errors transformed to standard API response format

- [ ] T5.3: Create request logging middleware (Complexity: Medium)
  - Description: Create src/middleware/logger.ts using LogTape
  - Dependencies: T3.4
  - Acceptance: Logs method, path, status, duration for each request

- [ ] T5.4: Create JWT authentication plugin (Complexity: Medium)
  - Description: Create src/middleware/jwt.ts with @elysiajs/jwt configuration
  - Dependencies: T3.3
  - Acceptance: JWT plugin configured with secret from env

- [ ] T5.5: Create auth guard middleware (Complexity: Medium)
  - Description: Create src/middleware/authGuard.ts to protect routes
  - Dependencies: T5.4
  - Acceptance: Rejects requests without valid Bearer tokens (401)

- [ ] T5.6: Create middleware index export (Complexity: Simple)
  - Description: Create src/middleware/index.ts for clean imports
  - Dependencies: T5.2, T5.3, T5.4, T5.5
  - Acceptance: Clean imports from middleware module work

### Phase 6: Health Module (Goal: Create first working endpoint)
- [ ] T6.1: Create health service (Complexity: Simple)
  - Description: Create src/modules/health/service.ts with getHealthStatus()
  - Dependencies: T2.2
  - Acceptance: Returns status, version, uptime

- [ ] T6.2: Create health controller (Complexity: Medium)
  - Description: Create src/modules/health/index.ts with GET /health route
  - Dependencies: T6.1, T5.1
  - Acceptance: GET /api/v1/health returns 200 with correct payload

- [ ] T6.3: Create health module tests (Complexity: Medium)
  - Description: Create tests/modules/health.test.ts
  - Dependencies: T6.2
  - Acceptance: Tests pass with `bun test`

### Phase 7: Application Assembly (Goal: Wire everything together)
- [ ] T7.1: Create main Elysia app instance (Complexity: Medium)
  - Description: Create src/app.ts with plugins and middleware
  - Dependencies: T5.6, T6.2
  - Acceptance: App instance exported with all middleware applied

- [ ] T7.2: Create entry point (Complexity: Medium)
  - Description: Update src/index.ts to initialize LogTape and start server
  - Dependencies: T7.1, T4.2, T3.4
  - Acceptance: `bun run dev` starts server with logging

- [ ] T7.3: Add npm scripts (Complexity: Simple)
  - Description: Add dev, build, test, lint, migrate scripts to package.json
  - Dependencies: T7.2
  - Acceptance: All scripts execute successfully

- [ ] T7.4: Create CORS configuration (Complexity: Simple)
  - Description: Create src/config/cors.ts for development CORS settings
  - Dependencies: T3.3
  - Acceptance: CORS headers present in responses

- [ ] T7.5: Add graceful shutdown handling (Complexity: Medium)
  - Description: Handle SIGTERM in src/index.ts to close DB connection
  - Dependencies: T7.2, T4.5
  - Acceptance: SIGTERM closes database connection gracefully

### Phase 8: Documentation & Finalization (Goal: Complete setup documentation)
- [ ] T8.1: Update webapi README (Complexity: Simple)
  - Description: Create webapi/README.md with setup instructions
  - Dependencies: T7.3
  - Acceptance: README documents all commands and setup steps

- [ ] T8.2: Verify all tests pass (Complexity: Simple)
  - Description: Run full test suite
  - Dependencies: T6.3, T7.3
  - Acceptance: `bun test` exits with code 0

- [ ] T8.3: Verify linting passes (Complexity: Simple)
  - Description: Run linter on all source files
  - Dependencies: T7.3
  - Acceptance: `bun run lint` exits with code 0

## Rollup
- Open Tasks: 23
- Completed Tasks: 12
- Blockers: none
- Next Priority: T3.1

## Notes
- Keep tasks aligned with Plan.md scope; do not introduce new scope without review.
- All environment variables documented in .env.example before creating .env
- Database directory auto-created to prevent startup failures
- API versioning (/api/v1/) established from start for future compatibility
