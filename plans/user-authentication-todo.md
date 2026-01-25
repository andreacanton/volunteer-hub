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
- [x] T1: Create users table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/002_create_users_table.sql` with id, email, password_hash, role, created_at, updated_at columns
  - Dependencies: none (001_init_migrations.sql exists)
  - Acceptance: `bun run migrate` succeeds, users table exists with correct schema
  - Notes: Use TEXT for all columns, UUID for id, role defaults to 'VOLUNTEER'

- [x] T2: Create refresh_tokens table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/003_create_refresh_tokens_table.sql` with id, user_id, token_hash, expires_at, created_at, revoked_at columns
  - Dependencies: T1
  - Acceptance: refresh_tokens table exists with foreign key to users(id) ON DELETE CASCADE
  - Notes: token_hash stores SHA-256 hash, revoked_at is NULL when active

- [x] T3: Create password_resets table migration (Complexity: Simple)
  - Description: Create `webapi/migrations/004_create_password_resets_table.sql` with id, user_id, token_hash, expires_at, created_at, used_at columns
  - Dependencies: T1
  - Acceptance: password_resets table exists with foreign key to users(id) ON DELETE CASCADE
  - Notes: used_at is NULL when unused

### Phase 2: Core Auth Infrastructure (Goal: Supporting utilities)
- [ ] T4: Add auth error codes to constants (Complexity: Simple)
  - Description: Create `webapi/src/constants/errorCodes.ts` with AUTH_USER_EXISTS, AUTH_INVALID_CREDENTIALS, AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED, AUTH_TOKEN_REVOKED, AUTH_USER_NOT_FOUND
  - Dependencies: none
  - Acceptance: All auth error codes exported and typed
  - Notes: Follow existing error code pattern from CLAUDE.md

- [ ] T5: Create crypto utilities for token hashing (Complexity: Medium)
  - Description: Create `webapi/src/utils/crypto.ts` with `hashToken()` (SHA-256), `generateToken()` (32 bytes random hex), `compareTokens()` (constant-time)
  - Dependencies: none
  - Acceptance: Functions work correctly, constant-time comparison prevents timing attacks
  - Notes: Use native crypto APIs

- [ ] T6: Add UserRole enum to constants (Complexity: Simple)
  - Description: Create `webapi/src/constants/userRole.ts` with VOLUNTEER, COORDINATOR, ADMIN enum values
  - Dependencies: none
  - Acceptance: UserRole enum exported
  - Notes: Use string enum for database compatibility

- [ ] T7: Update environment config with new variables (Complexity: Medium)
  - Description: Update `webapi/src/config/env.ts` to validate JWT_REFRESH_EXPIRES_IN, PASSWORD_RESET_EXPIRES_IN, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL
  - Dependencies: none
  - Acceptance: New env vars validated with sensible defaults, app starts correctly
  - Notes: SMTP vars optional for dev (password reset disabled without them)

### Phase 3: Auth Module - Registration & Login (Goal: Basic auth flow)
- [ ] T8: Implement auth service - user operations (Complexity: Medium)
  - Description: Create `webapi/src/modules/auth/service.ts` with `createUser()`, `validateCredentials()`, `getUserByEmail()` functions
  - Dependencies: T1, T5, T6
  - Acceptance: Can create user with hashed password, validate credentials, lookup by email
  - Notes: Use Bun.password for argon2 hashing, pure functions

- [ ] T9: Implement auth service - token operations (Complexity: Medium)
  - Description: Add to `webapi/src/modules/auth/service.ts`: `createRefreshToken()`, `validateRefreshToken()`, `revokeRefreshToken()`, `revokeAllUserTokens()`
  - Dependencies: T8
  - Acceptance: Can create, validate, and revoke refresh tokens with proper hash storage
  - Notes: Token rotation on refresh, store hash not plaintext

- [ ] T10: Implement registration endpoint (Complexity: Medium)
  - Description: Create `webapi/src/modules/auth/index.ts` with POST /auth/register endpoint
  - Dependencies: T8
  - Acceptance: Returns success on valid registration, proper validation errors (email format, password strength, duplicate email)
  - Notes: TypeBox schemas for validation, no auto-login after registration

- [ ] T11: Implement login endpoint (Complexity: Medium)
  - Description: Add POST /auth/login to auth module
  - Dependencies: T9
  - Acceptance: Returns accessToken, refreshToken, user object on valid credentials; 401 on invalid
  - Notes: Access token 15min expiry, refresh token 7 days

### Phase 4: Auth Module - Token Refresh & Logout (Goal: Session management)
- [ ] T12: Implement refresh endpoint (Complexity: Medium)
  - Description: Add POST /auth/refresh to auth module
  - Dependencies: T9
  - Acceptance: Rotates tokens correctly (old token invalidated, new tokens returned), rejects expired/revoked tokens
  - Notes: Token rotation is critical for security

- [ ] T13: Implement logout endpoint (Complexity: Simple)
  - Description: Add POST /auth/logout to auth module
  - Dependencies: T9
  - Acceptance: Revokes refresh token, returns success
  - Notes: Idempotent - success even if token already revoked

### Phase 5: Password Recovery (Goal: Self-service recovery)
- [ ] T14: Create email service (Complexity: Medium)
  - Description: Create `webapi/src/services/email.ts` with `sendPasswordResetEmail()` using nodemailer
  - Dependencies: T7
  - Acceptance: Sends email via SMTP with reset link containing token
  - Notes: Use FRONTEND_URL for reset link, graceful failure if SMTP not configured

- [ ] T15: Implement password reset service functions (Complexity: Medium)
  - Description: Add to auth service: `createPasswordReset()`, `validateResetToken()`, `resetPassword()`
  - Dependencies: T14
  - Acceptance: Can create reset token, validate it, update password and revoke all sessions
  - Notes: 1 hour expiry, single use, revokes all refresh tokens on reset

- [ ] T16: Implement forgot-password endpoint (Complexity: Simple)
  - Description: Add POST /auth/forgot-password to auth module
  - Dependencies: T15
  - Acceptance: Always returns success (prevents email enumeration), sends email if user exists
  - Notes: Constant-time response regardless of user existence

- [ ] T17: Implement reset-password endpoint (Complexity: Medium)
  - Description: Add POST /auth/reset-password to auth module
  - Dependencies: T15
  - Acceptance: Updates password with valid token, rejects expired/used tokens, revokes all sessions
  - Notes: Validate new password strength

### Phase 6: User Module & Integration (Goal: Complete integration)
- [ ] T18: Implement user service (Complexity: Simple)
  - Description: Create `webapi/src/modules/user/service.ts` with `getUserById()`, `updateUser()` functions
  - Dependencies: T1
  - Acceptance: Can fetch and update user profile
  - Notes: Pure functions, password update re-hashes

- [ ] T19: Implement user profile endpoints (Complexity: Medium)
  - Description: Create `webapi/src/modules/user/index.ts` with GET /users/me and PUT /users/me
  - Dependencies: T18
  - Acceptance: Protected routes return/update current user, 401 without valid token
  - Notes: Use existing authGuard middleware

- [ ] T20: Integrate modules into app.ts (Complexity: Simple)
  - Description: Mount auth and user modules in `webapi/src/app.ts`
  - Dependencies: T13, T17, T19
  - Acceptance: All auth and user endpoints accessible, health check passes
  - Notes: Mount under /api/v1/auth and /api/v1/users

- [ ] T21: Update .env.example with new variables (Complexity: Simple)
  - Description: Document all new env vars in `webapi/.env.example`
  - Dependencies: T7
  - Acceptance: All new variables documented with descriptions
  - Notes: Include sensible defaults where applicable

### Phase 7: Flutter - Auth Service & Storage (Goal: API integration layer)
- [ ] T22: Update AuthToken model for refresh tokens (Complexity: Simple)
  - Description: Update `ui/lib/models/auth_token.dart` with accessToken, refreshToken, expiresAt fields and JSON serialization
  - Dependencies: T11
  - Acceptance: Model correctly parses login response, handles both tokens
  - Notes: expiresAt for access token only

- [ ] T23: Extend StorageService for refresh token storage (Complexity: Simple)
  - Description: Update `ui/lib/services/storage_service.dart` with `saveRefreshToken()`, `getRefreshToken()`, `clearRefreshToken()`
  - Dependencies: T22
  - Acceptance: Refresh token persisted securely using FlutterSecureStorage
  - Notes: Separate from access token storage

- [ ] T24: Implement token refresh interceptor in ApiClient (Complexity: Complex)
  - Description: Update `ui/lib/services/api_client.dart` with Dio interceptor for automatic token refresh
  - Dependencies: T23
  - Acceptance: Interceptor detects 401, refreshes token, retries request; handles refresh failure (logout)
  - Notes: Queue concurrent requests during refresh, use lock to prevent multiple refreshes

- [ ] T25: Extend AuthService with new endpoints (Complexity: Medium)
  - Description: Update `ui/lib/services/auth_service.dart` with `register()`, `refreshToken()`, `requestPasswordReset()`, `resetPassword()` methods
  - Dependencies: T24
  - Acceptance: All new auth endpoints callable, proper error handling
  - Notes: Follow existing service patterns

### Phase 8: Flutter - Auth Provider & State (Goal: State management)
- [ ] T26: Extend AuthState for new flows (Complexity: Medium)
  - Description: Update `ui/lib/providers/auth_provider.dart` with AuthRegistering, AuthPasswordResetRequested, AuthPasswordResetSuccess states
  - Dependencies: T25
  - Acceptance: New states defined, can transition between them
  - Notes: Follow existing sealed class pattern

- [ ] T27: Extend AuthNotifier with new actions (Complexity: Medium)
  - Description: Add `register()`, `requestPasswordReset()`, `resetPassword()` actions to AuthNotifier
  - Dependencies: T26
  - Acceptance: Actions update state correctly, handle success/error
  - Notes: Use ref.listen for side effects (navigation, snackbars)

- [ ] T28: Add auto-refresh logic to AuthNotifier (Complexity: Complex)
  - Description: Implement proactive token refresh before access token expires
  - Dependencies: T24
  - Acceptance: Token refreshed automatically ~1min before expiry, seamless UX
  - Notes: Use Timer, cancel on logout

### Phase 9: Flutter - Auth Screens (Goal: User interface)
- [ ] T29: Create SignupScreen (Complexity: Medium)
  - Description: Create `ui/lib/screens/signup_screen.dart` with email/password form, validation, register action
  - Dependencies: T27
  - Acceptance: Form validates input, shows loading state, navigates to login on success, shows errors
  - Notes: Password strength indicator, confirm password field

- [ ] T30: Create ForgotPasswordScreen (Complexity: Simple)
  - Description: Create `ui/lib/screens/forgot_password_screen.dart` with email input form
  - Dependencies: T27
  - Acceptance: Email validated, submits request, shows success message
  - Notes: Always show success to prevent enumeration

- [ ] T31: Create ResetPasswordScreen (Complexity: Medium)
  - Description: Create `ui/lib/screens/reset_password_screen.dart` with new password form, token from deep link
  - Dependencies: T27
  - Acceptance: Extracts token from URL, validates password, resets and redirects to login
  - Notes: Handle invalid/expired token gracefully

- [ ] T32: Update LoginScreen with navigation links (Complexity: Simple)
  - Description: Add "Create account" and "Forgot password?" links to login screen
  - Dependencies: T29, T30
  - Acceptance: Links navigate to signup and forgot-password screens
  - Notes: Match existing design patterns

- [ ] T33: Update AuthGate for new navigation flows (Complexity: Medium)
  - Description: Update `ui/lib/main.dart` or navigation config for auth flow navigation
  - Dependencies: T29, T30, T31, T32
  - Acceptance: Can navigate between all auth screens, back navigation works
  - Notes: Consider go_router or Navigator 2.0 patterns

### Phase 10: Flutter - Deep Linking & Polish (Goal: Password reset UX)
- [ ] T34: Configure deep link handling for password reset (Complexity: Complex)
  - Description: Create `ui/lib/config/routes.dart` to handle `volunteerhub://reset-password?token=xxx` deep links
  - Dependencies: T31
  - Acceptance: App opens to ResetPasswordScreen when deep link clicked
  - Notes: Configure both iOS and Android app links

- [ ] T35: Update environment config with deep link scheme (Complexity: Simple)
  - Description: Update `ui/lib/config/env.dart` with configurable deep link scheme
  - Dependencies: T34
  - Acceptance: Scheme configurable per environment (dev/staging/prod)
  - Notes: Match FRONTEND_URL scheme

- [ ] T36: Add loading states and error handling polish (Complexity: Medium)
  - Description: Review all auth screens for consistent loading spinners, disabled inputs, error SnackBars
  - Dependencies: T29, T30, T31, T32
  - Acceptance: Consistent UX across all screens, no unhandled states
  - Notes: Consider shared loading/error widgets

- [ ] T37: Update User model for profile endpoint (Complexity: Simple)
  - Description: Verify/update `ui/lib/models/user.dart` to match /users/me response
  - Dependencies: T19
  - Acceptance: Model correctly parses user profile response
  - Notes: Include role field

## Rollup
- Open Tasks: 34
- Completed Tasks: 3
- Blockers: none
- Next Priority: T4 (auth error codes)

## Notes
- Backend (T1-T21) can be developed independently from frontend (T22-T37)
- T1-T3 (database) must complete before T8-T9 (auth service)
- T22-T25 (Flutter services) depend on backend API being available
- Deep linking (T34) may require additional platform-specific configuration not covered in this TODO
