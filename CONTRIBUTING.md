# Contributing to Volunteer Hub

Thank you for your interest in contributing to Volunteer Hub! This is the main source of truth for contribution guidelines. The `CLAUDE.md` file references this document and contains additional technical details for AI-assisted development.

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

## Filing Issues

Use the [issue templates](https://github.com/andreacanton/volunteer-hub/issues/new/choose) when creating a new issue:

- **Bug Report** — describe the bug, steps to reproduce, expected vs actual behavior, and your environment.
- **Feature Request** — explain the problem, your proposed solution, and alternatives you considered.

Fill in every section of the template. The more detail you provide, the easier it is for someone to pick up the issue.

## Resolving an Issue

1. **Pick an issue** — find an open issue you want to work on and assign yourself (or leave a comment so others know you're on it).
2. **Create a branch** from `main` with a short, descriptive name (e.g., `add-attendance-tracking`, `fix-login-redirect`). Do **not** use folder-like prefixes such as `feat/`, `fix/`, `doc/`, `chore/`, etc. — just a plain kebab-case name.
3. **Implement your changes** — follow the code style and architecture patterns described below and in [CLAUDE.md](CLAUDE.md).
4. **Run tests and linting** before committing (see [Testing](#testing)).
5. **Open a pull request** against `main` — the PR template will guide you through the checklist. Link the issue using `Closes #123` in the "Related issues" section so it is automatically closed when the PR merges.

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

- Keep PR as small as possible
- Fill out the PR template completely
- Link related issues (e.g., `Closes #123`)
- Ensure all tests pass and linting is clean
- Add tests for new functionality
- Include screenshots for UI changes

## Reporting Issues

Use the [issue templates](https://github.com/andreacanton/volunteer-hub/issues/new/choose) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
