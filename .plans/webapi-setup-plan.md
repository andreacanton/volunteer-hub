# Plan Blueprint Template

## 0. Overview
**Feature Name:** Initial Web API Setup - Volunteer Attendance Management Backend
**Priority:** High
**Date:** 2026-01-22

## 1. Context & Goals

### Problem Statement

    1. The Volunteer Attendance Management project currently has no backend implementation - only documentation exists (README.md, CLAUDE.md)
    2. Volunteers and coordinators need a REST API to manage service subscriptions, attendance tracking, and user authentication
    3. Without a proper API foundation, the Flutter mobile app cannot be developed or tested against real endpoints
    4. The project requires a scalable, type-safe backend architecture that follows Elysia best practices

### Primary Goals
    1. Establish the foundational Bun.js + Elysia project structure following feature-based organization
    2. Configure SQLite database connection using bun:sqlite with proper initialization
    3. Implement JWT authentication infrastructure with secure token handling
    4. Create base middleware for authentication, error handling, and request validation
    5. Set up development tooling (TypeScript, linting, testing framework)
    6. Implement health check and version endpoints to verify API functionality

## 2. Scope & Non-Goals

### In Scope
    1. Project initialization with Bun.js and package.json configuration
    2. Elysia framework setup with TypeScript configuration
    3. Feature-based folder structure (modules/auth, modules/user, etc.)
    4. SQLite database setup with bun:sqlite driver
    5. Database migration system scaffolding
    6. JWT plugin configuration with @elysiajs/jwt
    7. Base authentication middleware (token verification, protected routes)
    8. Error handling middleware with standardized error responses
    9. Environment variable configuration (.env support with validation)
    10. Health check endpoint (GET /health)
    11. API versioning structure (v1 prefix)
    12. Development scripts (dev, test, build, migrate)
    13. Basic logging infrastructure

### Out of Scope
    1. Full CRUD operations for all entities (User, Service, Attendance, etc.)
    2. User registration and login API endpoints (Phase 2)
    3. Business logic for attendance tracking
    4. Flutter frontend integration
    5. Production deployment configuration
    6. CI/CD pipeline setup
    7. Rate limiting and advanced security features
    8. API documentation generation (Swagger/OpenAPI)
    9. Email notifications
    10. Database seeding with test data

## 3. Requirements & Acceptance Criteria

### Functional Requirements

    1. **FR-01**: The API must start successfully on a configurable port (default: 3000)
    2. **FR-02**: Health check endpoint (GET /api/v1/health) must return 200 OK with server status
    3. **FR-03**: JWT tokens must be signable and verifiable using @elysiajs/jwt plugin
    4. **FR-04**: Protected routes must reject requests without valid Bearer tokens (401 Unauthorized)
    5. **FR-05**: SQLite database must initialize and create database file if it does not exist
    6. **FR-06**: Environment variables must be validated at startup (fail fast on missing required vars)
    7. **FR-07**: All API responses must follow a consistent JSON structure

### Non-Functional Requirements

    1. **NFR-01**: TypeScript strict mode must be enabled with no any types in core modules
    2. **NFR-02**: Method chaining must be used for all Elysia route definitions (per Elysia best practices)
    3. **NFR-03**: Services must be decoupled from Elysia context (pure functions or static classes)
    4. **NFR-04**: Code must pass ESLint checks with standardized configuration
    5. **NFR-05**: Response times for health check must be under 50ms
    6. **NFR-06**: Project must use Bun's native features where possible (bun:sqlite, Bun.password)
    7. **NFR-07**: All file imports must use explicit extensions (.ts) for Bun compatibility

## 4. Assumptions & Open Questions

### Assumptions
    1. Bun.js runtime (v1.0+) is installed on the development machine
    2. The backend will run as a standalone service (not serverless/edge)
    3. SQLite is sufficient for the expected scale (hundreds of volunteers, not thousands)
    4. JWT tokens will use HS256 algorithm with a single secret
    5. Access tokens will have 24-hour expiration; refresh tokens are out of scope for initial setup
    6. CORS will be configured to allow Flutter app origins
    7. The API will initially run HTTP only (HTTPS handled by reverse proxy in production)

### Blockers / Open Questions
    1. **[RESOLVED]** JWT token expiration duration: 24 hours
    2. **[RESOLVED]** Refresh tokens: deferred to Phase 2
    3. **[RESOLVED]** CORS origins for development: localhost:*
    4. **[RESOLVED]** Logging library: LogTape (@logtape/logtape)
    5. **[RESOLVED]** Project folder name: `webapi/`

## 5. Architecture & Integration

    1. **Affected components/layers:**
       - New `webapi/` directory with complete backend structure
       - No existing code to modify (greenfield setup)

    2. **Pattern to follow based on workspace conventions:**
       - Feature-based module organization (modules/auth, modules/user, etc.)
       - Elysia instance as controller pattern (no separate controller classes)
       - Services as static functions decoupled from HTTP context
       - Models defined using Elysia's `t` (TypeBox) for validation and type inference
       - Method chaining for all route definitions

    3. **External integrations:**
       - @elysiajs/jwt for JWT authentication
       - @elysiajs/cors for Cross-Origin Resource Sharing
       - @logtape/logtape for structured logging
       - bun:sqlite (built-in) for SQLite database access
       - Bun.password (built-in) for password hashing (future use)

    4. **Layered Architecture:**
       ```
       Routes (Elysia instances)
           |
       Middleware (auth, validation, error handling)
           |
       Services (business logic - pure functions)
           |
       Database (SQLite via bun:sqlite)
       ```

## 6. Data Model / Contracts

### Models & Enums

**Environment Config Model:**
    - PORT: number (default: 3000)
    - NODE_ENV: "development" | "production" | "test"
    - JWT_SECRET: string (required)
    - JWT_EXPIRES_IN: string (default: "24h")
    - DATABASE_PATH: string (default: "./database/volunteer-hub.db")
    - LOG_LEVEL: "trace" | "debug" | "info" | "warning" | "error" | "fatal"

**User Role Enum:**
    - VOLUNTEER = "volunteer"
    - COORDINATOR = "coordinator"
    - ADMIN = "admin"

**Standard API Response Model:**
    - success: boolean
    - data: T | null
    - error: ErrorDetails | null
    - timestamp: string (ISO 8601)

**Error Details Model:**
    - code: string (e.g., "AUTH_TOKEN_INVALID")
    - message: string
    - details: object | null

### API Contracts

    1. **GET /api/v1/health**
       - Request: None
       - Response: `{ success: true, data: { status: "healthy", version: "1.0.0", uptime: number }, timestamp: string }`
       - Auth: None required

    2. **Protected Route Pattern (middleware)**
       - Request Header: `Authorization: Bearer <token>`
       - On success: Proceeds to handler with decoded JWT payload in context
       - On failure: `{ success: false, error: { code: "AUTH_TOKEN_INVALID", message: "..." } }` (401)

### Validation Rules
    - JWT_SECRET must be at least 32 characters
    - PORT must be between 1024 and 65535
    - DATABASE_PATH must be a valid file path

### Status Transitions (if applicable)
    - N/A for initial setup (no stateful entities yet)

## 7. Error Handling & Observability

    1. **Error Strategy:**
       - Global error handler middleware catches all unhandled exceptions
       - Errors are transformed into standardized API response format
       - Sensitive error details are hidden in production mode
       - HTTP status codes follow REST conventions (400, 401, 403, 404, 500)

    2. **Logging / Metrics / Tracing Notes:**
       - LogTape (@logtape/logtape) for structured logging with hierarchical categories
       - Log levels: trace, debug, info, warning, error, fatal (configurable via LOG_LEVEL env var)
       - Logger categories: ["volunteer-hub", "module-name"] for hierarchical filtering
       - Request logging middleware to capture: method, path, status, duration
       - Error logging includes stack traces in development mode only
       - Configure LogTape with getConsoleSink() at application entry point

    3. **Error Table:**

        | Exception Type | HTTP Status | Response Code | Logging Level |
        |----------------|-------------|---------------|---------------|
        | ValidationError | 400 | VALIDATION_ERROR | warning |
        | AuthTokenMissing | 401 | AUTH_TOKEN_MISSING | info |
        | AuthTokenInvalid | 401 | AUTH_TOKEN_INVALID | info |
        | AuthTokenExpired | 401 | AUTH_TOKEN_EXPIRED | info |
        | NotFoundError | 404 | RESOURCE_NOT_FOUND | info |
        | DatabaseError | 500 | DATABASE_ERROR | error |
        | UnknownError | 500 | INTERNAL_ERROR | error |

## 8. Risks & Edge Cases

    1. **Risks:**
       - R1: JWT secret exposed in version control - Mitigation: .env.example with placeholder, .gitignore for .env
       - R2: SQLite file corruption - Mitigation: WAL mode enabled, proper shutdown handling
       - R3: Bun version incompatibility - Mitigation: Document minimum Bun version in package.json engines field
       - R4: Memory leaks from unclosed database connections - Mitigation: Singleton database instance with graceful shutdown

    2. **Edge Cases:**
       - EC1: Server starts with missing environment variables - Handled: Fail fast with descriptive error
       - EC2: Database file path directory does not exist - Handled: Auto-create directory on startup
       - EC3: JWT token is malformed (not valid Base64) - Handled: Return AUTH_TOKEN_INVALID
       - EC4: Request with empty Authorization header - Handled: Return AUTH_TOKEN_MISSING
       - EC5: Multiple Authorization headers - Handled: Use first header, ignore duplicates
       - EC6: Health check called during database initialization - Handled: Return degraded status

## 9. Implementation Plan (Phased)

### Phase 1: Project Initialization (Objective: Create Bun project with dependencies)
    - Step 1.1: Create webapi directory and initialize Bun project with `bun init`
      (File: webapi/package.json; Depends on: none; Done when: package.json exists with project metadata)
    - Step 1.2: Install core dependencies (elysia, @elysiajs/jwt, @elysiajs/cors, @logtape/logtape)
      (File: webapi/package.json; Depends on: 1.1; Done when: dependencies listed in package.json)
    - Step 1.3: Install dev dependencies (typescript, @types/bun, eslint, prettier, vitest)
      (File: webapi/package.json; Depends on: 1.1; Done when: devDependencies listed in package.json)
    - Step 1.4: Create TypeScript configuration with strict mode
      (File: webapi/tsconfig.json; Depends on: 1.1; Done when: tsconfig.json compiles without errors)
    - Step 1.5: Create ESLint and Prettier configuration
      (File: webapi/.eslintrc.js, webapi/.prettierrc; Depends on: 1.3; Done when: `bun run lint` passes)
    - Step 1.6: Create .gitignore for node_modules, .env, database files
      (File: webapi/.gitignore; Depends on: 1.1; Done when: sensitive files excluded from git)

### Phase 2: Folder Structure Setup (Objective: Establish feature-based architecture)
    - Step 2.1: Create src directory with entry point
      (File: webapi/src/index.ts; Depends on: 1.4; Done when: file exists with placeholder)
    - Step 2.2: Create modules directory structure (auth, user, health)
      (Files: webapi/src/modules/*/index.ts; Depends on: 2.1; Done when: directories exist)
    - Step 2.3: Create shared utilities directory (utils, types, constants)
      (Files: webapi/src/utils/, webapi/src/types/, webapi/src/constants/; Depends on: 2.1; Done when: directories exist)
    - Step 2.4: Create middleware directory
      (File: webapi/src/middleware/; Depends on: 2.1; Done when: directory exists)
    - Step 2.5: Create database directory structure
      (Files: webapi/src/database/, webapi/database/, webapi/migrations/; Depends on: 2.1; Done when: directories exist)
    - Step 2.6: Create tests directory structure
      (File: webapi/tests/; Depends on: 2.1; Done when: directory exists with sample test)

### Phase 3: Environment Configuration (Objective: Secure and validate configuration)
    - Step 3.1: Create .env.example with all required variables documented
      (File: webapi/.env.example; Depends on: 1.6; Done when: file lists all env vars with descriptions)
    - Step 3.2: Create environment validation module using TypeBox schema
      (File: webapi/src/config/env.ts; Depends on: 2.3; Done when: exports validated config object)
    - Step 3.3: Create config index that exports typed configuration
      (File: webapi/src/config/index.ts; Depends on: 3.2; Done when: `import { config } from './config'` works)
    - Step 3.4: Create LogTape configuration with console sink and hierarchical categories
      (File: webapi/src/config/logger.ts; Depends on: 3.2; Done when: `configureLogging()` function exported)

### Phase 4: Database Setup (Objective: Initialize SQLite with bun:sqlite)
    - Step 4.1: Create database connection singleton module
      (File: webapi/src/database/connection.ts; Depends on: 3.3; Done when: exports getDb() function)
    - Step 4.2: Create database initialization logic (directory creation, WAL mode)
      (File: webapi/src/database/init.ts; Depends on: 4.1; Done when: database file created on startup)
    - Step 4.3: Create migration runner scaffold (reads SQL files from migrations/)
      (File: webapi/src/database/migrate.ts; Depends on: 4.1; Done when: `bun run migrate` executes)
    - Step 4.4: Create initial migration for schema_migrations table
      (File: webapi/migrations/001_init_migrations.sql; Depends on: 4.3; Done when: migration table created)
    - Step 4.5: Create database index export
      (File: webapi/src/database/index.ts; Depends on: 4.1, 4.2; Done when: clean import from database module)

### Phase 5: Core Middleware (Objective: Implement authentication and error handling)
    - Step 5.1: Create standardized API response helpers
      (File: webapi/src/utils/response.ts; Depends on: 2.3; Done when: success() and error() helpers exported)
    - Step 5.2: Create error types and error handler middleware
      (File: webapi/src/middleware/errorHandler.ts; Depends on: 5.1; Done when: catches and formats all errors)
    - Step 5.3: Create request logging middleware using LogTape
      (File: webapi/src/middleware/logger.ts; Depends on: 3.4; Done when: logs method, path, status, duration via LogTape)
    - Step 5.4: Create JWT authentication plugin configuration
      (File: webapi/src/middleware/jwt.ts; Depends on: 3.3; Done when: JWT plugin configured with secret)
    - Step 5.5: Create auth guard middleware (protects routes requiring authentication)
      (File: webapi/src/middleware/authGuard.ts; Depends on: 5.4; Done when: rejects invalid/missing tokens)
    - Step 5.6: Create middleware index export
      (File: webapi/src/middleware/index.ts; Depends on: 5.2-5.5; Done when: clean imports from middleware)

### Phase 6: Health Module (Objective: Create first working endpoint)
    - Step 6.1: Create health service (returns status, version, uptime)
      (File: webapi/src/modules/health/service.ts; Depends on: 2.2; Done when: getHealthStatus() function works)
    - Step 6.2: Create health controller (Elysia instance with routes)
      (File: webapi/src/modules/health/index.ts; Depends on: 6.1, 5.1; Done when: GET /health returns 200)
    - Step 6.3: Create health module tests
      (File: webapi/tests/modules/health.test.ts; Depends on: 6.2; Done when: tests pass)

### Phase 7: Application Assembly (Objective: Wire everything together)
    - Step 7.1: Create main Elysia app instance with plugins and middleware
      (File: webapi/src/app.ts; Depends on: 5.6, 6.2; Done when: app instance exported)
    - Step 7.2: Create entry point that initializes LogTape and starts server
      (File: webapi/src/index.ts; Depends on: 7.1, 4.2, 3.4; Done when: `bun run dev` starts server with logging)
    - Step 7.3: Add npm scripts for dev, build, test, lint, migrate
      (File: webapi/package.json; Depends on: 7.2; Done when: all scripts execute successfully)
    - Step 7.4: Create CORS configuration for development
      (File: webapi/src/config/cors.ts; Depends on: 3.3; Done when: CORS headers in responses)
    - Step 7.5: Add graceful shutdown handling
      (File: webapi/src/index.ts; Depends on: 7.2, 4.5; Done when: SIGTERM closes DB connection)

### Phase 8: Documentation & Finalization (Objective: Complete setup documentation)
    - Step 8.1: Update webapi README with setup instructions
      (File: webapi/README.md; Depends on: 7.3; Done when: README documents all commands)
    - Step 8.2: Verify all tests pass
      (Depends on: 6.3, 7.3; Done when: `bun test` exits with code 0)
    - Step 8.3: Verify linting passes
      (Depends on: 7.3; Done when: `bun run lint` exits with code 0)

## 10. Testing Strategy

### Unit Tests
    1. **Environment Validation Tests** (webapi/tests/config/env.test.ts)
       - Test: Valid config loads successfully
       - Test: Missing JWT_SECRET throws error
       - Test: Invalid PORT value throws error
       - Test: Default values applied when optional vars missing

    2. **Response Helper Tests** (webapi/tests/utils/response.test.ts)
       - Test: success() returns correct structure with data
       - Test: error() returns correct structure with error details
       - Test: timestamp is valid ISO 8601 format

    3. **Health Service Tests** (webapi/tests/modules/health/service.test.ts)
       - Test: Returns status "healthy" when database connected
       - Test: Returns correct version from package.json
       - Test: Uptime increases over time

### Integration/API Tests
    1. **Health Endpoint Tests** (webapi/tests/modules/health/api.test.ts)
       - Test: GET /api/v1/health returns 200 with correct payload
       - Test: Response content-type is application/json
       - Test: Response time is under 50ms

    2. **Auth Middleware Tests** (webapi/tests/middleware/auth.test.ts)
       - Test: Request without Authorization header returns 401
       - Test: Request with invalid token returns 401
       - Test: Request with expired token returns 401
       - Test: Request with valid token proceeds to handler

    3. **Error Handler Tests** (webapi/tests/middleware/errorHandler.test.ts)
       - Test: Thrown errors are caught and formatted
       - Test: 404 for unknown routes
       - Test: Stack traces hidden in production mode

### Negative/Error Cases
    1. Malformed JSON request body returns 400
    2. Extremely long Authorization header handled gracefully
    3. Database connection failure returns 503 on health check
    4. Invalid JWT algorithm in token returns 401

### Fixtures/Data
    1. **Valid JWT Token Fixture**: Pre-generated token for testing protected routes
    2. **Expired JWT Token Fixture**: Token with past expiration for testing expiry handling
    3. **Malformed JWT Token Fixture**: Invalid format strings for error testing
    4. **Environment Variables Fixture**: .env.test file with test configuration

## 11. Rollout / Mitigation / Compatibility

    1. **Mitigation Steps:**
       - Create .env.example before .env to ensure template exists in version control
       - Database directory auto-created to prevent startup failures
       - Graceful error messages for missing dependencies

    2. **Backward Compatibility:**
       - N/A (greenfield project, no existing API to maintain)
       - API versioning (/api/v1/) established from start for future compatibility

    3. **Feature Flags / Toggles:**
       - LOG_LEVEL environment variable controls debug output
       - NODE_ENV controls error detail exposure (stack traces)

    4. **Deployment Configurations:**
       - Development: `bun run dev` with hot reload
       - Production: `bun run start` (after build)
       - Test: `bun test` with test environment variables
       - Minimum Bun version: 1.0.0 (document in package.json engines)

## 12. Checklist Before Handoff to TODO

    1. Open Questions? **No** - All critical questions resolved with reasonable assumptions
    2. Dependencies captured per step? **Yes** - Each step lists explicit dependencies
    3. Acceptance criteria aligned with tests? **Yes** - Each functional requirement has corresponding test

## Appendix: Key Design Decisions

    1. **Decision:** Use feature-based module organization instead of layer-based (routes/, controllers/, services/)
       - **Rationale:** Follows Elysia best practices, improves code locality, makes it easier to add/remove features, and aligns with official documentation recommendations.

    2. **Decision:** Elysia instance as controller pattern (no separate controller classes)
       - **Rationale:** Avoids type complexity, maintains type integrity through method chaining, and is the recommended pattern per Elysia documentation.

    3. **Decision:** Use TypeBox (Elysia's `t`) for models instead of separate interfaces
       - **Rationale:** Single source of truth for validation and types, automatic type inference, and runtime validation without code duplication.

    4. **Decision:** bun:sqlite instead of better-sqlite3 or other drivers
       - **Rationale:** Native Bun integration, no external dependencies, excellent performance, and zero configuration required.

    5. **Decision:** Simple migration system (SQL files with numeric prefix) instead of ORM
       - **Rationale:** Full control over SQL, no ORM learning curve, SQLite-specific optimizations possible, and easier debugging.

    6. **Decision:** Vitest for testing instead of Jest
       - **Rationale:** Better ESM support, faster execution with Bun, and simpler configuration for TypeScript projects.

    7. **Decision:** LogTape (@logtape/logtape) for structured logging
       - **Rationale:** Hierarchical logger categories for filtering by module, template literal syntax for clean log statements, lazy evaluation for performance, and built-in support for structured data logging.
