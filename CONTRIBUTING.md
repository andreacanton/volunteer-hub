# Contributing to Volunteer Hub

Thank you for your interest in contributing to Volunteer Hub! This guide will help you get started.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest)
- [Flutter](https://flutter.dev/) (stable channel, web enabled)
- [Playwright](https://playwright.dev/) (for E2E tests)

### Setup

1. Fork and clone the repository
2. Copy the environment file:
   ```bash
   cp webapi/.env.example webapi/.env
   ```
   Set `JWT_SECRET` to a string of at least 32 characters.
3. Install dependencies:
   ```bash
   cd webapi && bun install
   cd ../e2e && bun install
   cd ../ui && flutter pub get
   ```
4. Run database migrations:
   ```bash
   cd webapi && bun run migrate
   ```
5. Start the development servers:
   ```bash
   # Backend (from webapi/)
   bun run dev

   # Frontend (from ui/)
   flutter run -d chrome
   ```

## Development Workflow

1. Create a branch from `main` with a descriptive name (e.g., `add-attendance-tracking`, `fix-login-redirect`)
2. Make your changes
3. Run tests and linting before committing
4. Open a pull request against `main`

## Project Structure

The project is organized into three main areas:

- **`webapi/`** — Bun.js + Elysia REST API with SQLite
- **`ui/`** — Flutter web frontend
- **`e2e/`** — Playwright end-to-end tests

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Code Style

### General

- UTF-8 encoding, LF line endings
- 2-space indentation (spaces, not tabs)
- Trim trailing whitespace
- Insert final newline

### Backend (TypeScript)

- Feature-based module organization under `webapi/src/modules/`
- Each module has `index.ts` (routes) and `service.ts` (business logic)
- Use Elysia's `t` (TypeBox) for request/response validation
- Keep services decoupled from Elysia context (pure functions)
- Use explicit `.ts` file extensions in imports
- Follow the standard API response format (see CLAUDE.md)

### Frontend (Dart/Flutter)

- Follow standard Flutter/Dart conventions
- Organize code into `models/`, `services/`, `providers/`, `screens/`, `widgets/`

## Testing

Run all tests from the project root:

```bash
bun run test          # All tests (webapi + ui + e2e)
```

Or run individually:

```bash
bun run test:webapi   # Backend unit tests
bun run test:ui       # Flutter widget tests
bun run test:e2e      # Playwright E2E tests
bun run test:bruno    # Bruno API tests
```

### Backend Tests

- Run with `bun test` from `webapi/`
- Tests use SQLite in-memory databases

### Frontend Tests

- Run with `flutter test` from `ui/`

### E2E Tests

- Run with `bunx playwright test` from `e2e/`
- The Playwright config auto-starts backend and frontend servers if not already running

## Pull Requests

- Fill out the PR template completely
- Link related issues (e.g., `Closes #123`)
- Ensure all tests pass and linting is clean
- Add tests for new functionality
- Include screenshots for UI changes

## Reporting Issues

Use the [issue templates](https://github.com/andreacanton/volunteer-hub/issues/new/choose) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
