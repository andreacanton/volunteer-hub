# Volunteer Hub Web API

RESTful API backend for the Volunteer Attendance Management system, built with Bun.js and Elysia framework.

## Overview

This API provides endpoints for managing volunteer service subscriptions, attendance tracking, and user authentication. It uses JWT-based authentication, SQLite for data persistence, and follows a feature-based module architecture.

## Technology Stack

- **Runtime**: [Bun](https://bun.sh) v1.0+
- **Framework**: [Elysia](https://elysiajs.com) v1.4+
- **Database**: SQLite with `bun:sqlite` (native driver)
- **Authentication**: JWT tokens via `@elysiajs/jwt`
- **Logging**: [LogTape](https://github.com/dahlia/logtape) with hierarchical categories
- **Language**: TypeScript (strict mode)

## Prerequisites

- Bun runtime v1.0 or higher ([installation guide](https://bun.sh/docs/installation))
- Git (for cloning the repository)

## Quick Start

### 1. Installation

Clone the repository and install dependencies:

```bash
cd webapi
bun install
```

### 2. Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

**Required**: Generate a secure JWT secret (minimum 32 characters):

```bash
# Linux/macOS
openssl rand -base64 32

# Or use any strong random string generator
```

Update the `.env` file with your generated secret:

```env
JWT_SECRET=your-generated-secret-here
```

All other environment variables have sensible defaults and are optional. See [Configuration](#configuration) section for details.

### 3. Database Setup

Run migrations to initialize the database:

```bash
bun run migrate
```

This creates:
- SQLite database file at `./database/volunteer-hub.db` (or path specified in `DATABASE_PATH`)
- `schema_migrations` table for tracking applied migrations
- Database directory if it doesn't exist

### 4. Start Development Server

```bash
bun run dev
```

The API will start with hot-reload enabled. You should see:

```
[volunteer-hub] Starting Volunteer Hub API...
[volunteer-hub] Environment: development
[volunteer-hub] Database: ./database/volunteer-hub.db
🦊 Elysia is running at http://localhost:3000
```

### 5. Verify Installation

Test the health endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "uptime": 1234
  },
  "error": null,
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot-reload |
| `bun run build` | Build for production (outputs to `./dist`) |
| `bun run start` | Start production server (no hot-reload) |
| `bun run migrate` | Run pending database migrations |
| `bun test` | Run test suite with Bun's built-in test runner |
| `bun run lint` | Lint source code with ESLint |
| `bun run format` | Format code with Prettier |

## Configuration

All configuration is managed through environment variables. Copy `.env.example` to `.env` and customize as needed.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 chars) | `your-secret-key-min-32-characters-here` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode: `development` \| `production` \| `test` |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration (e.g., `1h`, `24h`, `7d`) |
| `DATABASE_PATH` | `./database/volunteer-hub.db` | SQLite database file path |
| `LOG_LEVEL` | `info` | Logging level: `trace` \| `debug` \| `info` \| `warning` \| `error` \| `fatal` |

### Environment Validation

The application validates all environment variables at startup using TypeBox schemas. If required variables are missing or invalid, the application will fail fast with descriptive error messages.

## Project Structure

```
webapi/
├── src/
│   ├── modules/           # Feature-based modules
│   │   ├── health/        # Health check endpoint
│   │   ├── auth/          # Authentication (future)
│   │   └── user/          # User management (future)
│   ├── middleware/        # Global middleware
│   │   ├── authGuard.ts   # JWT authentication middleware
│   │   ├── errorHandler.ts # Global error handler
│   │   ├── logger.ts      # Request logging
│   │   └── jwt.ts         # JWT plugin configuration
│   ├── config/            # Configuration modules
│   │   ├── env.ts         # Environment validation
│   │   ├── logger.ts      # LogTape setup
│   │   └── cors.ts        # CORS configuration
│   ├── database/          # Database layer
│   │   ├── connection.ts  # SQLite connection singleton
│   │   ├── init.ts        # Database initialization
│   │   └── migrate.ts     # Migration runner
│   ├── utils/             # Shared utilities
│   │   └── response.ts    # Standardized API responses
│   ├── types/             # Shared TypeScript types
│   ├── constants/         # Application constants
│   ├── app.ts             # Main Elysia app assembly
│   └── index.ts           # Application entry point
├── migrations/            # SQL migration files
│   └── 001_init_migrations.sql
├── database/              # SQLite database files (gitignored)
├── tests/                 # Test files
├── .env.example           # Environment variable template
└── package.json
```

## Architecture

### Feature-Based Organization

This project uses **feature-based module organization** instead of layer-based (routes/, controllers/, services/). Each module contains all related code:

- `index.ts` - Elysia instance with route definitions (controller layer)
- `service.ts` - Business logic as pure functions (service layer)
- Additional files as needed (models, types, etc.)

**Benefits**:
- Better code locality
- Easier to add/remove features
- Follows Elysia best practices

### Middleware Stack

Requests flow through middleware in this order:

1. **CORS** (`@elysiajs/cors`) - Handle cross-origin requests
2. **Request Logger** - Log HTTP requests via LogTape
3. **JWT Plugin** - Make JWT signing/verification available
4. **Error Handler** - Catch and format all errors
5. **Auth Guard** (route-specific) - Protect routes requiring authentication

### Database Layer

- **Driver**: `bun:sqlite` (native Bun module, zero dependencies)
- **Connection**: Singleton pattern with WAL mode enabled
- **Migrations**: SQL files with numeric prefix (001_*.sql, 002_*.sql)
- **Graceful Shutdown**: Database connection closed on SIGTERM/SIGINT

### API Response Format

All endpoints return a standardized JSON structure:

```typescript
{
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: object;
  } | null;
  timestamp: string; // ISO 8601
}
```

**Example success response**:

```json
{
  "success": true,
  "data": { "id": 1, "name": "John Doe" },
  "error": null,
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

**Example error response**:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_TOKEN_INVALID",
    "message": "Invalid or malformed JWT token"
  },
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTH_TOKEN_MISSING` | 401 | No Authorization header |
| `AUTH_TOKEN_INVALID` | 401 | Malformed or invalid token |
| `AUTH_TOKEN_EXPIRED` | 401 | Token past expiration |
| `RESOURCE_NOT_FOUND` | 404 | Entity not found |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## API Documentation

### Base URL

- Development: `http://localhost:3000/api/v1`
- Production: (TBD)

### Endpoints

#### GET /api/v1/health

Health check endpoint to verify API status.

**Authentication**: None required

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "uptime": 1234
  },
  "error": null,
  "timestamp": "2026-01-23T10:00:00.000Z"
}
```

#### Protected Routes (Future)

Routes requiring authentication must include a Bearer token:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:3000/api/v1/protected
```

Responses for authentication failures:

- **401 AUTH_TOKEN_MISSING**: No Authorization header provided
- **401 AUTH_TOKEN_INVALID**: Token is malformed or signature is invalid
- **401 AUTH_TOKEN_EXPIRED**: Token has expired

## Testing

Run the test suite:

```bash
bun test
```

Run with coverage:

```bash
bun test --coverage
```

Run specific test file:

```bash
bun test tests/modules/health.test.ts
```

### Test Structure

```
tests/
├── modules/           # Module-specific tests
│   └── health.test.ts
├── middleware/        # Middleware tests (future)
├── utils/             # Utility tests (future)
└── example.test.ts    # Example test file
```

## Development Guidelines

### TypeScript

- Strict mode enabled
- No `any` types in core modules
- Explicit `.ts` extensions in imports (required for Bun)

### Code Style

- ESLint configuration provided
- Prettier for formatting
- Run `bun run lint` before committing
- Run `bun run format` to auto-fix formatting

### Adding New Migrations

1. Create a new file in `migrations/` with numeric prefix:

```bash
migrations/002_create_users_table.sql
```

2. Write SQL with both up and down sections:

```sql
-- UP
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE
);

-- DOWN
DROP TABLE IF EXISTS users;
```

3. Run migrations:

```bash
bun run migrate
```

### Creating New Modules

1. Create module directory:

```bash
mkdir -p src/modules/mymodule
```

2. Create `index.ts` (Elysia instance with routes):

```typescript
import { Elysia } from 'elysia';

export const myModule = new Elysia({ prefix: '/mymodule' })
  .get('/', () => 'Hello from mymodule');
```

3. Create `service.ts` (business logic):

```typescript
export class MyModuleService {
  static doSomething() {
    // Pure function, no Elysia context dependency
  }
}
```

4. Register in `src/app.ts`:

```typescript
import { myModule } from './modules/mymodule/index.ts';

const app = new Elysia()
  .use(myModule)
  // ... other modules
```

## Logging

This project uses [LogTape](https://github.com/dahlia/logtape) for structured logging with hierarchical categories.

### Log Levels

Set via `LOG_LEVEL` environment variable:

- `trace` - Most verbose, includes all debug details
- `debug` - Development debugging
- `info` - General informational messages (default)
- `warning` - Warning messages
- `error` - Error messages
- `fatal` - Critical errors

### Logger Categories

Loggers use hierarchical categories for filtering:

```
[volunteer-hub]                 # Root logger
[volunteer-hub:database]        # Database operations
[volunteer-hub:auth]            # Authentication
[volunteer-hub:health]          # Health module
```

### Example Usage

```typescript
import { getLogger } from '@logtape/logtape';

const logger = getLogger(['volunteer-hub', 'mymodule']);

logger.info('Operation completed', { userId: 123 });
logger.error('Operation failed', { error: err.message });
```

## Troubleshooting

### Application won't start

**Problem**: `Error: JWT_SECRET is required`

**Solution**: Ensure `.env` file exists with a valid `JWT_SECRET` (minimum 32 characters). Copy from `.env.example` if needed.

---

**Problem**: `Error: Cannot find module 'elysia'`

**Solution**: Run `bun install` to install dependencies.

---

**Problem**: `EADDRINUSE: address already in use`

**Solution**: Port 3000 is already in use. Either:
- Change `PORT` in `.env` to a different port
- Stop the process using port 3000: `lsof -ti:3000 | xargs kill`

---

### Database issues

**Problem**: `Error: unable to open database file`

**Solution**: Ensure the directory for `DATABASE_PATH` exists, or run `bun run migrate` to auto-create it.

---

**Problem**: `Error: database disk image is malformed`

**Solution**: Database file is corrupted. Delete `database/volunteer-hub.db` and run `bun run migrate` to recreate it.

---

### Development issues

**Problem**: Changes not reflecting with hot-reload

**Solution**: Restart the dev server (`bun run dev`). If issues persist, try clearing Bun's cache: `rm -rf ~/.bun/install/cache`

---

## Production Deployment

### Building

```bash
bun run build
```

Outputs compiled files to `./dist`.

### Running in Production

```bash
NODE_ENV=production bun run start
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, randomly generated `JWT_SECRET` (min 32 chars)
- [ ] Set appropriate `LOG_LEVEL` (typically `info` or `warning`)
- [ ] Configure `DATABASE_PATH` to persistent storage location
- [ ] Set up reverse proxy (nginx, Caddy) for HTTPS
- [ ] Configure CORS for production frontend origins
- [ ] Set up log aggregation (optional)
- [ ] Configure health check monitoring
- [ ] Set up automated backups for SQLite database

## Contributing

1. Follow the existing code style and architecture patterns
2. Run tests and linting before submitting changes
3. Update documentation for new features
4. Use feature branches for development

## License

[Add license information]

## Support

For issues or questions, please [open an issue](https://github.com/your-org/volunteer-hub/issues) on GitHub.
