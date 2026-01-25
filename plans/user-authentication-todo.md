# User Authentication TODO

## Metadata
- Feature: User Authentication System
- Plan Source: plans/user-authentication-plan.md
- Service/Repo: volunteer-hub (webapi + ui)
- Date: 2026-01-25
- Owner/Reviewer: TBD
- Links: Issue #4

## Phases

### Phase 1: Database Schema (Goal: Establish data layer)
- [x] T1.1: Create users table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/002_create_users_table.sql` with id, email, password_hash, role, created_at, updated_at columns
  - Dependencies: none (001_init_migrations.sql exists)
  - Acceptance: `bun run migrate` succeeds, users table exists with correct schema
  - Notes: Use TEXT for all columns, UUID for id, role defaults to 'VOLUNTEER'

- [x] T1.2: Create refresh_tokens table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/003_create_refresh_tokens_table.sql` with id, user_id, token_hash, expires_at, created_at, revoked_at columns
  - Dependencies: T1.1
  - Acceptance: refresh_tokens table exists with foreign key to users(id) ON DELETE CASCADE
  - Notes: token_hash stores SHA-256 hash, revoked_at is NULL when active

- [x] T1.3: Create password_resets table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/004_create_password_resets_table.sql` with id, user_id, token_hash, expires_at, created_at, used_at columns
  - Dependencies: T1.1
  - Acceptance: password_resets table exists with foreign key to users(id) ON DELETE CASCADE
  - Notes: used_at is NULL when unused

### Phase 2: Core Auth Infrastructure (Goal: Supporting utilities)
- [x] T2.1: Add auth error codes to constants (Complexity: Simple)
  - Description: Create `webapi/src/constants/errorCodes.ts` with AUTH_USER_EXISTS, AUTH_INVALID_CREDENTIALS, AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED, AUTH_TOKEN_REVOKED, AUTH_USER_NOT_FOUND
  - Dependencies: none
  - Acceptance: All auth error codes exported and typed
  - Notes: Follow existing error code pattern from CLAUDE.md

- [x] T2.2: Create crypto utilities for token hashing (Complexity: Medium)
  - Description: Create `webapi/src/utils/crypto.ts` with `hashToken()` (SHA-256), `generateToken()` (32 bytes random hex), `compareTokens()` (constant-time)
  - Dependencies: none
  - Acceptance: Functions work correctly, constant-time comparison prevents timing attacks
  - Notes: Use native crypto APIs

- [x] T2.3: Add UserRole enum to constants (Complexity: Simple)
  - Description: Create `webapi/src/constants/userRole.ts` with VOLUNTEER, COORDINATOR, ADMIN enum values
  - Dependencies: none
  - Acceptance: UserRole enum exported
  - Notes: Use string enum for database compatibility

- [x] T2.4: Update environment config with new variables (Complexity: Medium)
  - Description: Update `webapi/src/config/env.ts` to validate JWT_REFRESH_EXPIRES_IN, PASSWORD_RESET_EXPIRES_IN, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL
  - Dependencies: none
  - Acceptance: New env vars validated with sensible defaults, app starts correctly
  - Notes: SMTP vars optional for dev (password reset disabled without them)

### Phase 3: Auth Module - Registration & Login (Goal: Basic auth flow)
- [x] T3.1: Implement auth service - user operations (Complexity: Medium)
  - Description: Create `webapi/src/modules/auth/service.ts` with `createUser()`, `validateCredentials()`, `getUserByEmail()` functions
  - Dependencies: T1.1, T2.2, T2.3
  - Acceptance: Can create user with hashed password, validate credentials, lookup by email
  - Notes: Use Bun.password for argon2 hashing, pure functions

- [x] T3.2: Implement auth service - token operations (Complexity: Medium)
  - Description: Add to `webapi/src/modules/auth/service.ts`: `createRefreshToken()`, `validateRefreshToken()`, `revokeRefreshToken()`, `revokeAllUserTokens()`
  - Dependencies: T3.1
  - Acceptance: Can create, validate, and revoke refresh tokens with proper hash storage
  - Notes: Token rotation on refresh, store hash not plaintext

- [x] T3.3: Implement registration endpoint (Complexity: Medium)
  - Description: Create `webapi/src/modules/auth/index.ts` with POST /auth/register endpoint
  - Dependencies: T3.1
  - Acceptance: Returns success on valid registration, proper validation errors (email format, password strength, duplicate email)
  - Notes: TypeBox schemas for validation, no auto-login after registration

- [x] T3.4: Implement login endpoint (Complexity: Medium)
  - Description: Add POST /auth/login to auth module
  - Dependencies: T3.2
  - Acceptance: Returns accessToken, refreshToken, user object on valid credentials; 401 on invalid
  - Notes: Access token 15min expiry, refresh token 7 days

### Phase 4: Auth Module - Token Refresh & Logout (Goal: Session management)
- [x] T4.1: Implement refresh endpoint (Complexity: Medium)
  - Description: Add POST /auth/refresh to auth module
  - Dependencies: T3.2
  - Acceptance: Rotates tokens correctly (old token invalidated, new tokens returned), rejects expired/revoked tokens
  - Notes: Token rotation is critical for security

- [x] T4.1a: Bruno e2e tests for refresh endpoint (Complexity: Simple)
  - Description: Create Bruno tests in `webapi/tests/bruno/Auth/`: `refresh-success.bru` (valid token rotation), `refresh-invalid-token.bru` (reject malformed token), `refresh-expired-token.bru` (reject expired), `refresh-revoked-token.bru` (reject already revoked)
  - Dependencies: T4.1
  - Acceptance: All tests pass with `bun run test:bruno:auth`, validates token rotation and error cases
  - Notes: Test that old refresh token is invalidated after successful refresh

- [x] T4.2: Implement logout endpoint (Complexity: Simple)
  - Description: Add POST /auth/logout to auth module
  - Dependencies: T3.2
  - Acceptance: Revokes refresh token, returns success
  - Notes: Idempotent - success even if token already revoked

- [x] T4.2a: Bruno e2e tests for logout endpoint (Complexity: Simple)
  - Description: Create Bruno tests in `webapi/tests/bruno/Auth/`: `logout-success.bru` (revokes token), `logout-idempotent.bru` (success on already revoked token), `logout-invalid-token.bru` (handles invalid token gracefully)
  - Dependencies: T4.2
  - Acceptance: All tests pass, validates idempotent behavior
  - Notes: Verify refresh token cannot be used after logout

### Phase 5: Password Recovery (Goal: Self-service recovery)
- [x] T5.1: Create email service (Complexity: Medium)
  - Description: Create `webapi/src/services/email.ts` with `sendPasswordResetEmail()` using nodemailer
  - Dependencies: T2.4
  - Acceptance: Sends email via SMTP with reset link containing token
  - Notes: Use FRONTEND_URL for reset link, graceful failure if SMTP not configured

- [x] T5.2: Implement password reset service functions (Complexity: Medium)
  - Description: Add to auth service: `createPasswordReset()`, `validateResetToken()`, `resetPassword()`
  - Dependencies: T5.1
  - Acceptance: Can create reset token, validate it, update password and revoke all sessions
  - Notes: 1 hour expiry, single use, revokes all refresh tokens on reset

- [x] T5.3: Implement forgot-password endpoint (Complexity: Simple)
  - Description: Add POST /auth/forgot-password to auth module
  - Dependencies: T5.2
  - Acceptance: Always returns success (prevents email enumeration), sends email if user exists
  - Notes: Constant-time response regardless of user existence

- [x] T5.3a: Bruno e2e tests for forgot-password endpoint (Complexity: Simple)
  - Description: Create Bruno tests in `webapi/tests/bruno/Auth/`: `forgot-password-existing.bru` (success for existing email), `forgot-password-nonexistent.bru` (success for non-existent email - no enumeration), `forgot-password-invalid-email.bru` (validation error for malformed email)
  - Dependencies: T5.3
  - Acceptance: All tests pass, both existing and non-existing emails return identical success response
  - Notes: Cannot test actual email sending, just response behavior

- [x] T5.4: Implement reset-password endpoint (Complexity: Medium)
  - Description: Add POST /auth/reset-password to auth module
  - Dependencies: T5.2
  - Acceptance: Updates password with valid token, rejects expired/used tokens, revokes all sessions
  - Notes: Validate new password strength

- [x] T5.4a: Bruno e2e tests for reset-password endpoint (Complexity: Medium)
  - Description: Create Bruno tests in `webapi/tests/bruno/Auth/`: `reset-password-success.bru` (valid token resets password), `reset-password-invalid-token.bru` (reject invalid token), `reset-password-expired-token.bru` (reject expired token), `reset-password-used-token.bru` (reject already used token), `reset-password-weak.bru` (reject weak password)
  - Dependencies: T5.4
  - Acceptance: All tests pass, validates token lifecycle and password strength requirements
  - Notes: Test flow requires creating reset token first (script:pre-request or test dependency)

### Phase 6: User Module & Integration (Goal: Complete integration)
- [ ] T6.1: Implement user service (Complexity: Simple)
  - Description: Create `webapi/src/modules/user/service.ts` with `getUserById()`, `updateUser()` functions
  - Dependencies: T1.1
  - Acceptance: Can fetch and update user profile
  - Notes: Pure functions, password update re-hashes

- [ ] T6.2: Implement user profile endpoints (Complexity: Medium)
  - Description: Create `webapi/src/modules/user/index.ts` with GET /users/me and PUT /users/me
  - Dependencies: T6.1
  - Acceptance: Protected routes return/update current user, 401 without valid token
  - Notes: Use existing authGuard middleware

- [ ] T6.2a: Bruno e2e tests for user profile endpoints (Complexity: Medium)
  - Description: Create Bruno tests in `webapi/tests/bruno/User/`: `get-profile-success.bru` (authenticated user gets profile), `get-profile-unauthorized.bru` (401 without token), `update-profile-success.bru` (update firstName/lastName), `update-profile-unauthorized.bru` (401 without token), `update-profile-validation.bru` (validation errors for invalid data)
  - Dependencies: T6.2
  - Acceptance: All tests pass with `bun run test:bruno:user`, validates auth guard and CRUD operations
  - Notes: Use auth_token variable from login-success.bru for authenticated requests

- [ ] T6.3: Integrate modules into app.ts (Complexity: Simple)
  - Description: Mount auth and user modules in `webapi/src/app.ts`
  - Dependencies: T4.2, T5.4, T6.2
  - Acceptance: All auth and user endpoints accessible, health check passes
  - Notes: Mount under /api/v1/auth and /api/v1/users

- [ ] T6.4: Update .env.example with new variables (Complexity: Simple)
  - Description: Document all new env vars in `webapi/.env.example`
  - Dependencies: T2.4
  - Acceptance: All new variables documented with descriptions
  - Notes: Include sensible defaults where applicable

### Phase 7: Flutter - Auth Service & Storage (Goal: API integration layer)
- [ ] T7.1: Update AuthToken model for refresh tokens (Complexity: Simple)
  - Description: Update `ui/lib/models/auth_token.dart` with accessToken, refreshToken, expiresAt fields and JSON serialization
  - Dependencies: T3.4
  - Acceptance: Model correctly parses login response, handles both tokens
  - Notes: expiresAt for access token only

- [ ] T7.2: Extend StorageService for refresh token storage (Complexity: Simple)
  - Description: Update `ui/lib/services/storage_service.dart` with `saveRefreshToken()`, `getRefreshToken()`, `clearRefreshToken()`
  - Dependencies: T7.1
  - Acceptance: Refresh token persisted securely using FlutterSecureStorage
  - Notes: Separate from access token storage

- [ ] T7.3: Implement token refresh interceptor in ApiClient (Complexity: Complex)
  - Description: Update `ui/lib/services/api_client.dart` with Dio interceptor for automatic token refresh
  - Dependencies: T7.2
  - Acceptance: Interceptor detects 401, refreshes token, retries request; handles refresh failure (logout)
  - Notes: Queue concurrent requests during refresh, use lock to prevent multiple refreshes

- [ ] T7.4: Extend AuthService with new endpoints (Complexity: Medium)
  - Description: Update `ui/lib/services/auth_service.dart` with `register()`, `refreshToken()`, `requestPasswordReset()`, `resetPassword()` methods
  - Dependencies: T7.3
  - Acceptance: All new auth endpoints callable, proper error handling
  - Notes: Follow existing service patterns

### Phase 8: Flutter - Auth Provider & State (Goal: State management)
- [ ] T8.1: Extend AuthState for new flows (Complexity: Medium)
  - Description: Update `ui/lib/providers/auth_provider.dart` with AuthRegistering, AuthPasswordResetRequested, AuthPasswordResetSuccess states
  - Dependencies: T7.4
  - Acceptance: New states defined, can transition between them
  - Notes: Follow existing sealed class pattern

- [ ] T8.2: Extend AuthNotifier with new actions (Complexity: Medium)
  - Description: Add `register()`, `requestPasswordReset()`, `resetPassword()` actions to AuthNotifier
  - Dependencies: T8.1
  - Acceptance: Actions update state correctly, handle success/error
  - Notes: Use ref.listen for side effects (navigation, snackbars)

- [ ] T8.3: Add auto-refresh logic to AuthNotifier (Complexity: Complex)
  - Description: Implement proactive token refresh before access token expires
  - Dependencies: T7.3
  - Acceptance: Token refreshed automatically ~1min before expiry, seamless UX
  - Notes: Use Timer, cancel on logout

### Phase 9: Flutter - Auth Screens (Goal: User interface)
- [ ] T9.1: Create SignupScreen (Complexity: Medium)
  - Description: Create `ui/lib/screens/signup_screen.dart` with email/password form, validation, register action
  - Dependencies: T8.2
  - Acceptance: Form validates input, shows loading state, navigates to login on success, shows errors
  - Notes: Password strength indicator, confirm password field

- [ ] T9.2: Create ForgotPasswordScreen (Complexity: Simple)
  - Description: Create `ui/lib/screens/forgot_password_screen.dart` with email input form
  - Dependencies: T8.2
  - Acceptance: Email validated, submits request, shows success message
  - Notes: Always show success to prevent enumeration

- [ ] T9.3: Create ResetPasswordScreen (Complexity: Medium)
  - Description: Create `ui/lib/screens/reset_password_screen.dart` with new password form, token from deep link
  - Dependencies: T8.2
  - Acceptance: Extracts token from URL, validates password, resets and redirects to login
  - Notes: Handle invalid/expired token gracefully

- [ ] T9.4: Update LoginScreen with navigation links (Complexity: Simple)
  - Description: Add "Create account" and "Forgot password?" links to login screen
  - Dependencies: T9.1, T9.2
  - Acceptance: Links navigate to signup and forgot-password screens
  - Notes: Match existing design patterns

- [ ] T9.5: Update AuthGate for new navigation flows (Complexity: Medium)
  - Description: Update `ui/lib/main.dart` or navigation config for auth flow navigation
  - Dependencies: T9.1, T9.2, T9.3, T9.4
  - Acceptance: Can navigate between all auth screens, back navigation works
  - Notes: Consider go_router or Navigator 2.0 patterns

### Phase 10: Flutter - Deep Linking & Polish (Goal: Password reset UX)
- [ ] T10.1: Configure deep link handling for password reset (Complexity: Complex)
  - Description: Create `ui/lib/config/routes.dart` to handle `volunteerhub://reset-password?token=xxx` deep links
  - Dependencies: T9.3
  - Acceptance: App opens to ResetPasswordScreen when deep link clicked
  - Notes: Configure both iOS and Android app links

- [ ] T10.2: Update environment config with deep link scheme (Complexity: Simple)
  - Description: Update `ui/lib/config/env.dart` with configurable deep link scheme
  - Dependencies: T10.1
  - Acceptance: Scheme configurable per environment (dev/staging/prod)
  - Notes: Match FRONTEND_URL scheme

- [ ] T10.3: Add loading states and error handling polish (Complexity: Medium)
  - Description: Review all auth screens for consistent loading spinners, disabled inputs, error SnackBars
  - Dependencies: T9.1, T9.2, T9.3, T9.4
  - Acceptance: Consistent UX across all screens, no unhandled states
  - Notes: Consider shared loading/error widgets

- [ ] T10.4: Update User model for profile endpoint (Complexity: Simple)
  - Description: Verify/update `ui/lib/models/user.dart` to match /users/me response
  - Dependencies: T6.2
  - Acceptance: Model correctly parses user profile response
  - Notes: Include role field

## Rollup
- Open Tasks: 21
- Completed Tasks: 21
- Blockers: none
- Next Priority: T6.1 (user service)

## Notes
- Backend (T1.1-T6.4) can be developed independently from frontend (T7.1-T10.4)
- T1.1-T1.3 (database) must complete before T3.1-T3.2 (auth service)
- T7.1-T7.4 (Flutter services) depend on backend API being available
- Deep linking (T10.1) may require additional platform-specific configuration not covered in this TODO
- Bruno e2e tests (T4.1a, T4.2a, T5.3a, T5.4a, T6.2a) should be run after each endpoint implementation
- Add `test:bruno:user` npm script in package.json for User module tests
