# Plan: User Authentication

## 0. Overview
**Feature Name:** User Authentication System
**Priority:** High
**Date:** 2026-01-25
**Issue ID:** #4

## 1. Context & Goals

### Problem Statement

1. The application lacks user authentication - volunteers and coordinators cannot securely identify themselves
2. No persistent login mechanism exists - users would need to re-authenticate on every session
3. No password recovery option - users who forget passwords have no self-service recovery path

### Primary Goals
1. Implement secure user registration and login with JWT access tokens
2. Implement refresh token workflow for persistent sessions without compromising security
3. Implement password recovery via email for self-service account recovery

## 2. Scope & Non-Goals

### In Scope

**Backend (webapi):**
1. User database schema (users table with email, password hash, role, timestamps)
2. Refresh token storage and rotation (refresh_tokens table)
3. Password reset token storage (password_resets table)
4. Registration endpoint with email/password validation
5. Login endpoint returning access + refresh tokens
6. Token refresh endpoint with rotation
7. Logout endpoint (revoke refresh token)
8. Forgot password endpoint (generate reset token, send email)
9. Reset password endpoint (validate token, update password)

**Frontend (Flutter ui):**
10. Signup screen with form validation
11. Login screen updates (links to signup/forgot password)
12. Forgot password screen (email submission)
13. Reset password screen (new password form, deep link handling)
14. Automatic token refresh interceptor
15. Secure storage for refresh tokens

### Out of Scope
1. OAuth/social login providers (Google, GitHub, etc.)
2. Multi-factor authentication (MFA/2FA)
3. Email verification on registration
4. Account lockout after failed attempts
5. Session management UI (view/revoke active sessions)
6. Role-based access control implementation (RBAC) - only basic role field

## 3. Requirements & Acceptance Criteria

### Functional Requirements

1. **User Registration**
   - Accept email and password
   - Validate email format and uniqueness
   - Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
   - Hash password using Bun.password (argon2)
   - Create user with VOLUNTEER role by default
   - Return success (no auto-login)

2. **User Login**
   - Accept email and password
   - Validate credentials against stored hash
   - Generate JWT access token (15 min expiry)
   - Generate refresh token (7 days expiry), store hash in DB
   - Return both tokens

3. **Token Refresh**
   - Accept refresh token
   - Validate token exists and not expired/revoked
   - Rotate: revoke old token, issue new refresh token
   - Issue new access token
   - Return both new tokens

4. **Logout**
   - Accept refresh token
   - Revoke token (mark as revoked in DB)
   - Return success

5. **Forgot Password**
   - Accept email
   - If user exists, generate reset token (1 hour expiry)
   - Store token hash in DB
   - Send email with reset link
   - Always return success (prevent email enumeration)

6. **Reset Password**
   - Accept reset token and new password
   - Validate token exists, not expired, not used
   - Validate new password strength
   - Update user password hash
   - Mark reset token as used
   - Revoke all refresh tokens for user
   - Return success

### Non-Functional Requirements

1. **Security**
   - Passwords hashed with argon2 via Bun.password
   - Refresh tokens stored as SHA-256 hashes (not plaintext)
   - Reset tokens stored as SHA-256 hashes
   - Constant-time comparison for token validation
   - No sensitive data in JWT payload (no password, only id/email/role)

2. **API Standards**
   - Follow existing response format (success/data/error/timestamp)
   - Use existing error codes pattern
   - TypeBox schemas for all request/response validation
   - RESTful endpoints under `/api/v1/auth/*`

3. **Code Quality**
   - Services as pure functions (no Elysia context dependency)
   - Explicit `.ts` imports for Bun compatibility
   - Structured logging with LogTape

## 4. Assumptions & Open Questions

### Assumptions
1. Email service will be configured via SMTP environment variables
2. Single refresh token per device (not tracking multiple sessions)
3. Access token is short-lived (15 min), refresh token is long-lived (7 days)
4. Password reset invalidates all existing sessions (security best practice)
5. User roles are: VOLUNTEER, COORDINATOR, ADMIN (stored as string enum)

### Decisions Made
1. **Email provider:** nodemailer with SMTP for flexibility and self-hosting capability
2. **Token delivery:** Refresh token returned in response body (not cookies) for mobile app compatibility
3. **Frontend URL:** Configured via FRONTEND_URL environment variable for password reset links

## 5. Architecture & Integration

1. **Affected Components/Layers:**

   **Backend (webapi):**
   - Database: New migrations (002, 003, 004)
   - Modules: `auth/` (routes + service), `user/` (routes + service)
   - Config: New env variables for JWT refresh, SMTP, frontend URL
   - Utils: New crypto helpers for token hashing

   **Frontend (Flutter ui):**
   - Models: `auth_token.dart` (update), `user.dart` (verify)
   - Services: `auth_service.dart`, `storage_service.dart`, `api_client.dart`
   - Providers: `auth_provider.dart` (extend state and notifier)
   - Screens: `signup_screen.dart`, `forgot_password_screen.dart`, `reset_password_screen.dart` (new)
   - Config: `env.dart`, `routes.dart` (deep linking)

2. **Patterns to Follow:**

   **Backend:**
   - Feature-based module structure (existing pattern)
   - Elysia instance per module with chained routes
   - TypeBox `t` for validation schemas
   - Pure function services
   - `getDb()` singleton for database access
   - `success()`/`error()` response helpers

   **Frontend:**
   - Riverpod StateNotifier pattern for auth state
   - ConsumerWidget/ConsumerStatefulWidget for screens
   - `ref.watch()` for reactive UI, `ref.read()` for actions
   - `ref.listen()` for side effects (SnackBars, navigation)
   - Form validation in screen widgets
   - FlutterSecureStorage for sensitive data
   - Dio interceptors for automatic token handling

3. **External Integrations:**
   - SMTP server for sending password reset emails (via nodemailer)
   - Deep link scheme for password reset URLs

## 6. Data Model / Contracts

### Models & Enums

**User:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VOLUNTEER',  -- VOLUNTEER | COORDINATOR | ADMIN
  created_at TEXT NOT NULL,      -- ISO 8601
  updated_at TEXT NOT NULL       -- ISO 8601
);
```

**RefreshToken:**
```sql
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,           -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,      -- SHA-256 hash
  expires_at TEXT NOT NULL,      -- ISO 8601
  created_at TEXT NOT NULL,      -- ISO 8601
  revoked_at TEXT                -- ISO 8601, NULL if active
);
```

**PasswordReset:**
```sql
CREATE TABLE password_resets (
  id TEXT PRIMARY KEY,           -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,      -- SHA-256 hash
  expires_at TEXT NOT NULL,      -- ISO 8601
  created_at TEXT NOT NULL,      -- ISO 8601
  used_at TEXT                   -- ISO 8601, NULL if unused
);
```

**UserRole Enum:**
```typescript
enum UserRole {
  VOLUNTEER = 'VOLUNTEER',
  COORDINATOR = 'COORDINATOR',
  ADMIN = 'ADMIN'
}
```

### API Contracts

| Endpoint | Method | Auth | Request Body | Response |
|----------|--------|------|--------------|----------|
| `/auth/register` | POST | No | `{ email, password }` | `{ success: true }` |
| `/auth/login` | POST | No | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `/auth/refresh` | POST | No | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `/auth/logout` | POST | No | `{ refreshToken }` | `{ success: true }` |
| `/auth/forgot-password` | POST | No | `{ email }` | `{ success: true }` |
| `/auth/reset-password` | POST | No | `{ token, password }` | `{ success: true }` |
| `/users/me` | GET | Yes | - | `{ user }` |
| `/users/me` | PUT | Yes | `{ email?, password? }` | `{ user }` |

### Validation Rules

**Email:**
- Valid email format (RFC 5322)
- Max 255 characters
- Lowercase normalized

**Password:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Max 128 characters

**Tokens:**
- Refresh token: 64 character hex string (32 bytes random)
- Reset token: 64 character hex string (32 bytes random)

### Status Transitions

**Refresh Token Lifecycle:**
```
Created → Active → Revoked (on logout/refresh/password-reset)
                → Expired (after 7 days)
```

**Password Reset Token Lifecycle:**
```
Created → Active → Used (on successful reset)
                → Expired (after 1 hour)
```

## 7. Error Handling & Observability

### Error Strategy

| Scenario | Error Code | HTTP | Message |
|----------|------------|------|---------|
| Invalid email format | VALIDATION_ERROR | 400 | Invalid email format |
| Weak password | VALIDATION_ERROR | 400 | Password does not meet requirements |
| Email already registered | AUTH_USER_EXISTS | 409 | Email already registered |
| Invalid credentials | AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password |
| Refresh token invalid | AUTH_TOKEN_INVALID | 401 | Invalid refresh token |
| Refresh token expired | AUTH_TOKEN_EXPIRED | 401 | Refresh token expired |
| Refresh token revoked | AUTH_TOKEN_REVOKED | 401 | Refresh token has been revoked |
| Reset token invalid | AUTH_TOKEN_INVALID | 400 | Invalid or expired reset token |
| User not found (internal) | AUTH_USER_NOT_FOUND | 404 | User not found |

### Logging

- **Info level:** Successful login, registration, password reset
- **Warning level:** Failed login attempts, invalid tokens
- **Error level:** Database errors, email sending failures
- **Categories:** `["app", "auth"]`, `["app", "auth", "password-reset"]`

### Metrics (Future)
- Registration count
- Login success/failure rate
- Token refresh count
- Password reset request count

## 8. Risks & Edge Cases

### Risks
1. **Email enumeration via timing** - Mitigated by constant-time responses on forgot-password
2. **Refresh token theft** - Mitigated by rotation on each use
3. **Brute force attacks** - Not addressed in v1 (future: rate limiting)

### Edge Cases
1. User requests password reset while logged in - Should work (valid use case)
2. Multiple password reset requests - Each generates new token, old ones remain valid until expiry
3. User changes email while reset token pending - Reset still works (linked by user_id)
4. Concurrent refresh token usage - First one wins, second gets revoked error
5. Database unavailable during auth - Return 500 INTERNAL_ERROR

## 9. Implementation Plan (Phased)

### Phase 1: Database Schema (Objective: Establish data layer)

- **Step 1.1:** Create users table migration
  - File: `webapi/migrations/002_create_users_table.sql`
  - Depends on: 001_init_migrations.sql
  - Done when: `bun run migrate` succeeds, users table exists

- **Step 1.2:** Create refresh_tokens table migration
  - File: `webapi/migrations/003_create_refresh_tokens_table.sql`
  - Depends on: 002 (users table)
  - Done when: refresh_tokens table exists with foreign key

- **Step 1.3:** Create password_resets table migration
  - File: `webapi/migrations/004_create_password_resets_table.sql`
  - Depends on: 002 (users table)
  - Done when: password_resets table exists with foreign key

### Phase 2: Core Auth Infrastructure (Objective: Supporting utilities)

- **Step 2.1:** Add new error codes to constants
  - File: `webapi/src/constants/errorCodes.ts` (new)
  - Depends on: None
  - Done when: All auth error codes exported

- **Step 2.2:** Create crypto utilities for token hashing
  - File: `webapi/src/utils/crypto.ts` (new)
  - Depends on: None
  - Done when: `hashToken()`, `generateToken()`, `compareTokens()` implemented

- **Step 2.3:** Add UserRole enum to constants
  - File: `webapi/src/constants/userRole.ts` (new)
  - Depends on: None
  - Done when: UserRole enum exported

- **Step 2.4:** Update environment config with new variables
  - File: `webapi/src/config/env.ts`
  - Depends on: None
  - Done when: JWT_REFRESH_EXPIRES_IN, PASSWORD_RESET_EXPIRES_IN, SMTP_*, FRONTEND_URL validated

### Phase 3: Auth Module - Registration & Login (Objective: Basic auth flow)

- **Step 3.1:** Implement auth service - user operations
  - File: `webapi/src/modules/auth/service.ts` (new)
  - Depends on: Phase 1, Step 2.2, Step 2.3
  - Done when: `createUser()`, `validateCredentials()`, `getUserByEmail()` implemented

- **Step 3.2:** Implement auth service - token operations
  - File: `webapi/src/modules/auth/service.ts`
  - Depends on: Step 3.1
  - Done when: `createRefreshToken()`, `validateRefreshToken()`, `revokeRefreshToken()` implemented

- **Step 3.3:** Implement registration endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 3.1
  - Done when: POST /auth/register works with validation

- **Step 3.4:** Implement login endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 3.2
  - Done when: POST /auth/login returns access + refresh tokens

### Phase 4: Auth Module - Token Refresh & Logout (Objective: Session management)

- **Step 4.1:** Implement refresh endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 3.2
  - Done when: POST /auth/refresh rotates tokens correctly

- **Step 4.2:** Implement logout endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 3.2
  - Done when: POST /auth/logout revokes refresh token

### Phase 5: Password Recovery (Objective: Self-service recovery)

- **Step 5.1:** Create email service
  - File: `webapi/src/services/email.ts` (new)
  - Depends on: Step 2.4 (SMTP config)
  - Done when: `sendPasswordResetEmail()` sends email via SMTP

- **Step 5.2:** Implement password reset service functions
  - File: `webapi/src/modules/auth/service.ts`
  - Depends on: Step 5.1
  - Done when: `createPasswordReset()`, `validateResetToken()`, `resetPassword()` implemented

- **Step 5.3:** Implement forgot-password endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 5.2
  - Done when: POST /auth/forgot-password sends email (or no-op if user not found)

- **Step 5.4:** Implement reset-password endpoint
  - File: `webapi/src/modules/auth/index.ts`
  - Depends on: Step 5.2
  - Done when: POST /auth/reset-password updates password and revokes sessions

### Phase 6: User Module & Integration (Objective: Complete integration)

- **Step 6.1:** Implement user service
  - File: `webapi/src/modules/user/service.ts` (new)
  - Depends on: Phase 1
  - Done when: `getUserById()`, `updateUser()` implemented

- **Step 6.2:** Implement user profile endpoints
  - File: `webapi/src/modules/user/index.ts`
  - Depends on: Step 6.1, authGuard middleware
  - Done when: GET/PUT /users/me protected and working

- **Step 6.3:** Integrate modules into app.ts
  - File: `webapi/src/app.ts`
  - Depends on: All previous steps
  - Done when: Auth and user modules mounted, health check passes

- **Step 6.4:** Update .env.example with new variables
  - File: `webapi/.env.example`
  - Depends on: Step 2.4
  - Done when: All new env vars documented

### Phase 7: Flutter - Auth Service & Storage (Objective: API integration layer)

- **Step 7.1:** Update AuthToken model to support refresh tokens
  - File: `ui/lib/models/auth_token.dart`
  - Depends on: Phase 3 (API ready)
  - Done when: Model has accessToken, refreshToken, expiresAt fields with JSON serialization

- **Step 7.2:** Extend StorageService for refresh token storage
  - File: `ui/lib/services/storage_service.dart`
  - Depends on: Step 7.1
  - Done when: `saveRefreshToken()`, `getRefreshToken()`, `clearRefreshToken()` implemented

- **Step 7.3:** Implement token refresh interceptor in ApiClient
  - File: `ui/lib/services/api_client.dart`
  - Depends on: Step 7.2
  - Done when: Interceptor automatically refreshes expired access tokens using refresh token

- **Step 7.4:** Extend AuthService with new endpoints
  - File: `ui/lib/services/auth_service.dart`
  - Depends on: Step 7.3
  - Done when: `register()`, `refreshToken()`, `requestPasswordReset()`, `resetPassword()` methods implemented

### Phase 8: Flutter - Auth Provider & State (Objective: State management)

- **Step 8.1:** Extend AuthState for registration and password reset flows
  - File: `ui/lib/providers/auth_provider.dart`
  - Depends on: Step 7.4
  - Done when: New states added (AuthRegistering, AuthPasswordResetRequested, AuthPasswordResetSuccess)

- **Step 8.2:** Extend AuthNotifier with new actions
  - File: `ui/lib/providers/auth_provider.dart`
  - Depends on: Step 8.1
  - Done when: `register()`, `requestPasswordReset()`, `resetPassword()` actions implemented

- **Step 8.3:** Add auto-refresh logic to AuthNotifier
  - File: `ui/lib/providers/auth_provider.dart`
  - Depends on: Step 7.3
  - Done when: Token refresh triggers automatically before access token expires

### Phase 9: Flutter - Auth Screens (Objective: User interface)

- **Step 9.1:** Create SignupScreen
  - File: `ui/lib/screens/signup_screen.dart` (new)
  - Depends on: Step 8.2
  - Done when: Form with email/password fields, validation, submit to register(), navigation to login

- **Step 9.2:** Create ForgotPasswordScreen
  - File: `ui/lib/screens/forgot_password_screen.dart` (new)
  - Depends on: Step 8.2
  - Done when: Email input form, submit to requestPasswordReset(), success message displayed

- **Step 9.3:** Create ResetPasswordScreen
  - File: `ui/lib/screens/reset_password_screen.dart` (new)
  - Depends on: Step 8.2
  - Done when: Token from deep link, new password form, submit to resetPassword(), redirect to login

- **Step 9.4:** Update LoginScreen with navigation links
  - File: `ui/lib/screens/login_screen.dart`
  - Depends on: Steps 9.1, 9.2
  - Done when: "Create account" link to signup, "Forgot password?" link to forgot-password screen

- **Step 9.5:** Update AuthGate for new navigation flows
  - File: `ui/lib/main.dart`
  - Depends on: Steps 9.1-9.4
  - Done when: Navigation between login/signup/forgot-password screens works correctly

### Phase 10: Flutter - Deep Linking & Polish (Objective: Password reset UX)

- **Step 10.1:** Configure deep link handling for password reset
  - File: `ui/lib/config/routes.dart` (new)
  - Depends on: Step 9.3
  - Done when: App handles `volunterhub://reset-password?token=xxx` deep links

- **Step 10.2:** Update environment config with deep link scheme
  - File: `ui/lib/config/env.dart`
  - Depends on: Step 10.1
  - Done when: Deep link scheme configurable per environment

- **Step 10.3:** Add loading states and error handling polish
  - Files: All screens in `ui/lib/screens/`
  - Depends on: All previous UI steps
  - Done when: Consistent loading spinners, error SnackBars, disabled inputs during async operations

- **Step 10.4:** Update User model if needed for profile endpoint
  - File: `ui/lib/models/user.dart`
  - Depends on: Step 6.2 (API)
  - Done when: Model matches /users/me response structure

## 10. Testing Strategy

### Unit Tests

1. **Password validation** - Test strength requirements
2. **Token generation** - Verify randomness and format
3. **Token hashing** - Verify hash/compare functions
4. **Email validation** - Test format validation

### Integration/API Tests

1. **Registration flow:**
   - Success with valid data
   - Fail with invalid email
   - Fail with weak password
   - Fail with duplicate email

2. **Login flow:**
   - Success with correct credentials
   - Fail with wrong password
   - Fail with non-existent email

3. **Token refresh flow:**
   - Success with valid refresh token
   - Fail with expired token
   - Fail with revoked token
   - Verify old token invalidated after refresh

4. **Password reset flow:**
   - Request generates email (mock SMTP)
   - Reset with valid token succeeds
   - Reset with expired token fails
   - Reset invalidates existing sessions

### Negative/Error Cases

1. Malformed JSON body → 400 VALIDATION_ERROR
2. Missing required fields → 400 VALIDATION_ERROR
3. SQL injection attempts → Rejected by parameterized queries
4. Expired access token → 401 AUTH_TOKEN_EXPIRED
5. Invalid bearer format → 401 AUTH_TOKEN_INVALID

### Fixtures/Data

- Test user: `test@example.com` / `TestPass123`
- Expired refresh token fixture
- Used password reset token fixture

### Flutter Widget Tests

1. **SignupScreen:**
   - Form validation (email format, password strength)
   - Submit button disabled during loading
   - Error display on failure
   - Navigation to login on success

2. **ForgotPasswordScreen:**
   - Email validation
   - Success message display
   - Navigation back to login

3. **ResetPasswordScreen:**
   - Password validation (strength, match confirmation)
   - Token extraction from deep link
   - Success redirect to login

4. **LoginScreen:**
   - Navigation links to signup and forgot-password

### Flutter Integration Tests

1. **Token refresh flow:**
   - Mock expired access token
   - Verify interceptor calls refresh endpoint
   - Verify new tokens stored

2. **Auth state persistence:**
   - Login stores tokens
   - App restart restores session
   - Logout clears all stored data

## 11. Rollout / Mitigation / Compatibility

### Mitigation Steps
1. Database migrations are idempotent - safe to re-run
2. New tables don't affect existing functionality
3. Auth endpoints are additive - no breaking changes

### Backward Compatibility
- No existing auth system to maintain compatibility with
- API versioned at `/api/v1/` - future changes go to `/api/v2/`

### Feature Flags / Toggles
- None required for v1
- Future: `ENABLE_PASSWORD_RESET=true/false` if email not configured

### Deployment Configuration
1. Ensure JWT_SECRET is set (existing requirement)
2. Configure SMTP variables before enabling password reset
3. Set FRONTEND_URL to actual frontend domain

## 12. Checklist Before Handoff to TODO

1. **Open Questions?** No - All decisions made
2. **Dependencies captured per step?** Yes
3. **Acceptance criteria aligned with tests?** Yes

## Appendix: Key Design Decisions

1. **Decision:** Store refresh tokens as hashes, not plaintext
   - Rationale: If database is compromised, attacker cannot use stolen tokens

2. **Decision:** Refresh token rotation on each use
   - Rationale: Limits damage window if token is stolen; stolen token becomes invalid after legitimate use

3. **Decision:** Short access token (15 min) + long refresh token (7 days)
   - Rationale: Balance between security (frequent re-auth) and UX (don't require login every session)

4. **Decision:** Password reset revokes all sessions
   - Rationale: If password was compromised, attacker may have active sessions

5. **Decision:** Return tokens in body, not cookies
   - Rationale: Mobile app compatibility; frontend has full control over storage

6. **Decision:** Always return success on forgot-password
   - Rationale: Prevents email enumeration attacks

7. **Decision:** Use nodemailer with SMTP for email delivery
   - Rationale: Flexibility to use any SMTP provider, self-hostable, no vendor lock-in

8. **Decision:** Dio interceptor for automatic token refresh
   - Rationale: Transparent to UI layer; screens don't need to handle token expiry logic
