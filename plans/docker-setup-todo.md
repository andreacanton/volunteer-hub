# Container Setup TODO (Podman)

## Metadata
- Feature: Containerize Development Environment (Podman)
- Plan Source: plans/docker-setup.md
- Service/Repo: volunteer-hub
- Date: 2026-02-13
- Owner/Reviewer: andrea
- Links: plans/docker-setup.md, plans/blueprint-todo.md

## Phases

### Phase 1: Backend Dockerfile (Goal: Containerize the webapi service)
- [x] T1.1: Create `webapi/Dockerfile` with dev stage (Complexity: Medium)
  - Description: Create a multi-stage Dockerfile using `oven/bun:1` base image. Dev stage sets WORKDIR /app, copies package.json and bun.lock first for layer caching, runs `bun install`, copies source, exposes port 3000, CMD `bun run dev`.
  - Dependencies: none
  - Acceptance: `podman build --target dev ./webapi` succeeds without errors.

- [x] T1.2: Add production stage to `webapi/Dockerfile` (Complexity: Medium)
  - Description: Add a production stage that installs production deps only (`bun install --production`), copies source, runs `bun run build`, and uses a smaller runtime stage. CMD `bun run start`.
  - Dependencies: T1.1
  - Acceptance: `podman build --target production ./webapi` succeeds and produces a smaller image than dev.

- [x] T1.3: Create `webapi/.dockerignore` (Complexity: Simple)
  - Description: Create ignore file excluding node_modules/, dist/, out/, database/, *.db, *.db-shm, *.db-wal, .env, .env.*.local, coverage/, logs/, .eslintcache, .cache.
  - Dependencies: none
  - Acceptance: File exists and listed paths are excluded from build context.

### Phase 2: Entrypoint Script (Goal: Auto-run migrations on container start)
- [x] T2.1: Create `webapi/entrypoint.sh` (Complexity: Simple)
  - Description: Create a shell script that runs `bun run migrate` then executes `exec "$@"` to hand off to CMD. Set `set -e` for fail-fast. Add echo statements for visibility.
  - Dependencies: T1.1
  - Acceptance: Script is executable, runs migrations, then starts the app when used as ENTRYPOINT.

- [x] T2.2: Wire entrypoint into `webapi/Dockerfile` (Complexity: Simple)
  - Description: Add `COPY entrypoint.sh .` and `ENTRYPOINT ["./entrypoint.sh"]` to both dev and production stages in the Dockerfile.
  - Dependencies: T1.1, T2.1
  - Acceptance: Container starts by running migrations first, then the application.

### Phase 3: Compose (Goal: Orchestrate services with a single command)
- [x] T3.1: Create `docker-compose.yml` (Complexity: Medium)
  - Description: Define `webapi` service with build context, dev target, port mapping (${PORT:-3000}:3000), environment variables (NODE_ENV, JWT_SECRET, DATABASE_PATH, LOG_LEVEL), source mounts for hot reload (src/, migrations/), named volume for SQLite persistence (webapi-db), and health check hitting /api/v1/health.
  - Dependencies: T1.1, T2.2
  - Acceptance: `podman compose up` starts the backend; `curl http://localhost:3000/api/v1/health` returns healthy.

- [ ] T3.2: Add optional Flutter web service to `docker-compose.yml` (Complexity: Medium)
  - Description: Add `ui-web` service using `./ui` build context, port 8080:80, depends_on webapi (service_healthy), gated behind `profiles: [web]` so it only starts with `--profile web`.
  - Dependencies: T3.1, T4.1
  - Acceptance: `podman compose --profile web up` builds and serves Flutter web at http://localhost:8080.

- [x] T3.3: Create `docker-compose.override.yml` (Complexity: Simple)
  - Description: Add dev-specific overrides: expose Bun debugger port 6499:6499, set LOG_LEVEL=debug.
  - Dependencies: T3.1
  - Acceptance: `podman compose config` shows merged configuration with debug port and log level.

### Phase 4: Flutter Web Dockerfile (Goal: Optional browser-based testing)
- [ ] T4.1: Create `ui/Dockerfile` (Complexity: Medium)
  - Description: Use a Flutter SDK base image, copy pubspec.yaml and pubspec.lock, run `flutter pub get`, copy source, run `flutter build web`, then serve output from an `nginx:alpine` stage on port 80.
  - Dependencies: none
  - Acceptance: `podman build ./ui` succeeds and the built image serves Flutter web content.
  - Notes: This is optional — only needed for browser-based testing.

### Phase 5: Root Ignore File (Goal: Exclude irrelevant files from build context)
- [ ] T5.1: Create root `.dockerignore` (Complexity: Simple)
  - Description: Create root-level .dockerignore excluding .git, *.md, plans/, LICENSE, .github/.
  - Dependencies: none
  - Acceptance: File exists; build context excludes listed paths.

### Phase 6: Documentation (Goal: Document Podman usage for developers)
- [ ] T6.1: Add Podman section to root `README.md` (Complexity: Simple)
  - Description: Add a Podman section with commands for: starting backend (`podman compose up`), starting with Flutter web (`podman compose --profile web up`), rebuilding (`podman compose build`), resetting database (`podman compose down -v`), viewing logs (`podman compose logs -f webapi`).
  - Dependencies: T3.1
  - Acceptance: README contains Podman section with all listed commands.

### Phase 7: Verification (Goal: End-to-end validation)
- [ ] T7.1: Verify backend starts and health check passes (Complexity: Simple)
  - Description: Run `podman compose up` and confirm `curl http://localhost:3000/api/v1/health` returns a healthy response.
  - Dependencies: T3.1
  - Acceptance: Health endpoint returns success response.

- [ ] T7.2: Verify hot reload works with source mounts (Complexity: Simple)
  - Description: Edit a file in `webapi/src/` while the container is running and confirm Bun detects the change and reloads.
  - Dependencies: T7.1
  - Acceptance: Code change is reflected without restarting the container.

- [ ] T7.3: Verify SQLite persistence across restarts (Complexity: Simple)
  - Description: Create data via the API, run `podman compose down && podman compose up`, confirm data persists. Then run `podman compose down -v && podman compose up` and confirm data is reset.
  - Dependencies: T7.1
  - Acceptance: Data persists across restart; data resets when volumes are removed.

- [ ] T7.4: Verify Flutter web service (optional) (Complexity: Simple)
  - Description: Run `podman compose --profile web up` and confirm Flutter web is served at http://localhost:8080.
  - Dependencies: T3.2
  - Acceptance: Browser loads Flutter web app at localhost:8080.
  - Notes: Optional — only if ui/Dockerfile was created.

## Rollup
- Open Tasks: 7
- Completed Tasks: 7
- Blockers: T3.2 blocked by T4.1
- Next Priority: T4.1
