# Plan Blueprint Template

## 0. Overview
**Feature Name:** Flutter Frontend (UI) Setup
**Priority:** High
**Date:** 2026-01-23

## 1. Context & goals

### Problem statement

1. The backend API (Elysia + Bun.js) is set up but there is no frontend to consume it
2. Volunteers and coordinators need a mobile interface to manage attendance
3. The `ui/` directory does not exist yet and needs to be created from scratch

### Primary Goals
1. Create a Flutter project with proper structure following project conventions
2. Set up core dependencies (dio for HTTP, state management, secure storage)
3. Implement base architecture patterns (API client, models, services)
4. Create authentication flow foundation (login screen, token storage)
5. Establish reusable components and theming baseline

## 2. Scope & Non-Goals

### In Scope
1. Flutter project initialization with proper folder structure
2. Core dependencies installation (dio, flutter_riverpod, flutter_secure_storage)
3. API client service with interceptors for auth and error handling
4. Data models matching backend response format (ApiResponse, User)
5. Authentication service and secure token storage
6. Login screen UI
7. Basic app shell with navigation structure
8. Environment configuration (dev/prod API URLs)

### Out of scope
1. Full feature implementation (subscriptions, attendance, coordinator features)
2. Push notifications setup
3. Offline support / caching
4. Localization (Italian only for now)
5. Dark mode theming
6. Unit and widget tests (separate phase)
7. Backend implementation (auth endpoint, user API)

## 3. Requirements & Acceptance Criteria

### Functional requirements

1. **Project Structure**: Flutter project created at `ui/` with organized folder structure
2. **API Client**: Dio-based HTTP client with base URL configuration, auth interceptor, error handling
3. **Auth Service**: Login functionality that stores JWT token securely
4. **Login Screen**: Email/password form with validation, error display, loading states
5. **Navigation Shell**: Basic scaffold with authenticated/unauthenticated routing

### Non-Functional requirements

1. **Code Style**: Follow Dart/Flutter conventions (effective_dart lints)
2. **State Management**: Use Riverpod for consistent state management pattern
3. **Error Handling**: All API errors mapped to user-friendly messages
4. **Security**: JWT tokens stored in flutter_secure_storage (not SharedPreferences)

## 4. Assumption & Open Questions

### Assumptions
1. Backend API runs on `http://localhost:3000/api/v1/` in development
2. Auth endpoint will be `POST /api/v1/auth/login` with email/password body
3. Backend returns standard ApiResponse format with JWT token on successful login
4. Minimum Flutter SDK version: 3.19.0 (latest stable)
5. Target platforms: iOS and Android only (no web for Phase 1)

### Blockers / Open Questions
1. **[RESOLVED]** Auth endpoint not yet implemented in backend - proceed with planned contract
2. **[RESOLVED]** What should the app name/bundle ID be? `com.volunteerhub.app`
3. **[RESOLVED]** Any specific color scheme or branding guidelines? use Material 3 defaults

## 5. Architecture & Integration

1. **Affected components/layers**:
   - New `ui/` directory at project root
   - Will consume backend API at `/api/v1/`

2. **Pattern to follow based on workspace conventions**:
   - Feature-based folder structure mirroring backend modules
   - Riverpod for state management (providers pattern)
   - Repository pattern: Screen → Provider → Service → API Client
   - Separation of concerns: UI (screens/widgets), Logic (providers), Data (services/models)

3. **External integrations**:
   - Backend REST API (Elysia)
   - Platform secure storage (Keychain/Keystore)

## 6. Data Model / Contracts

### Models & Enum

**ApiResponse<T>** (generic wrapper):
- success: bool
- data: T?
- error: ApiError?
- timestamp: String (ISO 8601)

**ApiError**:
- code: String
- message: String
- details: Map<String, dynamic>?

**User**:
- id: int
- email: String
- name: String
- role: UserRole

**UserRole** (enum):
- volunteer
- coordinator
- admin

**AuthToken**:
- accessToken: String
- expiresAt: DateTime

**LoginRequest**:
- email: String
- password: String

### API Contracts

1. `POST /api/v1/auth/login`
   - Request: `{ "email": string, "password": string }`
   - Response: `ApiResponse<{ "user": User, "token": string }>`

2. `GET /api/v1/health`
   - Response: `ApiResponse<{ "status": string, "timestamp": string }>`

### Validation Rules
- Email: valid email format (regex)
- Password: minimum 1 character (backend validates strength)

### Status Transition (if applicable)
- Not applicable for initial setup

## 7. Error Handling & Observability

1. **Error strategy**:
   - API errors caught by Dio interceptor
   - Map error codes to user-friendly messages
   - Show SnackBar for transient errors, Dialog for critical errors

2. **Logging / metrics / tracing notes**:
   - Use `debugPrint` for development logging
   - No production analytics in Phase 1

3. **Error mapping table**:

| API Error Code     | User Message                             |
| ------------------ | ---------------------------------------- |
| VALIDATION_ERROR   | "Please check your input"                |
| AUTH_TOKEN_MISSING | "Please log in again"                    |
| AUTH_TOKEN_INVALID | "Session expired, please log in again"   |
| AUTH_TOKEN_EXPIRED | "Session expired, please log in again"   |
| RESOURCE_NOT_FOUND | "The requested item was not found"       |
| DATABASE_ERROR     | "Server error, please try again"         |
| INTERNAL_ERROR     | "Something went wrong, please try again" |
| Network Error      | "No internet connection"                 |

## 8. Risk Edge cases

1. **Risk**: Token expiration mid-session
   - Mitigation: Auth interceptor checks expiry, auto-logout and redirect to login

2. **Risk**: Network connectivity issues
   - Mitigation: Dio timeout configuration, user-friendly offline message

3. **Edge cases**:
   - Empty email/password submission → show validation error
   - Invalid credentials → show "Invalid email or password"
   - Server unreachable → show "Cannot connect to server"

## 9. Implementation Plan (Phased)

### Phase 1: Project Initialization (Objective: Create Flutter project with folder structure)
- Step 1.1: Run `flutter create` with proper organization (File: `ui/`; Depends on: none; Done when: `flutter run` shows default app)
- Step 1.2: Clean default files, create folder structure (File: `ui/lib/`; Depends on: 1.1; Done when: folders exist: models/, services/, providers/, screens/, widgets/, config/, utils/)
- Step 1.3: Configure analysis_options.yaml with lints (File: `ui/analysis_options.yaml`; Depends on: 1.1; Done when: `flutter analyze` passes)

### Phase 2: Dependencies Setup (Objective: Install and configure core packages)
- Step 2.1: Add dependencies to pubspec.yaml (File: `ui/pubspec.yaml`; Depends on: 1.1; Done when: `flutter pub get` succeeds)
- Step 2.2: Create environment configuration (File: `ui/lib/config/env.dart`; Depends on: 2.1; Done when: dev/prod URLs configurable)

### Phase 3: Core Infrastructure (Objective: API client and base services)
- Step 3.1: Create ApiResponse and ApiError models (File: `ui/lib/models/api_response.dart`; Depends on: 1.2; Done when: models match backend format)
- Step 3.2: Create User and AuthToken models (File: `ui/lib/models/user.dart`, `auth_token.dart`; Depends on: 3.1; Done when: JSON serialization works)
- Step 3.3: Implement ApiClient with Dio (File: `ui/lib/services/api_client.dart`; Depends on: 3.1, 2.2; Done when: can make HTTP requests)
- Step 3.4: Add auth interceptor to ApiClient (File: `ui/lib/services/api_client.dart`; Depends on: 3.3; Done when: token auto-attached to requests)

### Phase 4: Authentication (Objective: Login flow with secure storage)
- Step 4.1: Implement secure token storage (File: `ui/lib/services/storage_service.dart`; Depends on: 2.1; Done when: can save/read/delete token)
- Step 4.2: Create AuthService (File: `ui/lib/services/auth_service.dart`; Depends on: 3.3, 4.1; Done when: login/logout methods work)
- Step 4.3: Create AuthProvider with Riverpod (File: `ui/lib/providers/auth_provider.dart`; Depends on: 4.2; Done when: auth state reactive)

### Phase 5: UI Implementation (Objective: Login screen and app shell)
- Step 5.1: Create app theme configuration (File: `ui/lib/config/theme.dart`; Depends on: 1.2; Done when: Material 3 theme defined)
- Step 5.2: Create LoginScreen with form (File: `ui/lib/screens/login_screen.dart`; Depends on: 4.3, 5.1; Done when: can input email/password)
- Step 5.3: Create HomeScreen placeholder (File: `ui/lib/screens/home_screen.dart`; Depends on: 5.1; Done when: shows user info after login)
- Step 5.4: Setup app routing and shell (File: `ui/lib/main.dart`; Depends on: 5.2, 5.3; Done when: routes between login/home based on auth state)

### Phase 6: Integration & Polish (Objective: Wire everything together)
- Step 6.1: Connect login form to AuthProvider (File: `ui/lib/screens/login_screen.dart`; Depends on: 5.2, 4.3; Done when: login calls API)
- Step 6.2: Add loading states and error handling (File: `ui/lib/screens/login_screen.dart`; Depends on: 6.1; Done when: shows spinner and errors)
- Step 6.3: Verify end-to-end flow manually (Depends on: all; Done when: can login with test credentials against backend)

## 10. Testing Strategy

### Unit Tests
1. ApiResponse model JSON parsing
2. User model JSON parsing
3. AuthService login logic (mocked API)

### Integration/API Tests
1. ApiClient makes real HTTP request to health endpoint
2. Full login flow with test backend

### Negative/Error Cases
1. Login with invalid credentials → shows error
2. Login with network error → shows offline message
3. API returns unexpected format → graceful error

### Fixtures/Data
- Test user: `test@example.com` / `password123` (to be created in backend in later phase)

## 11. Rollout / Mitigation / Compatibility

1. **Mitigation steps**:
   - Test on both iOS simulator and Android emulator before marking complete
   - Verify token storage works on both platforms

2. **Backward compatibility**:
   - N/A (new project)

3. **Feature flags / toggles**:
   - None for initial setup

4. **Deployment configurations**:
   - Development: API at `http://localhost:3000`
   - Production: API URL to be configured via environment

## 12. Checklist Before Handoff to TODO

1. Open Questions? No
2. Dependencies captured per step? Yes
3. Acceptance criteria aligned with tests? Yes

## Appendix: Key Design Decision (Optional)

1. **Decision**: Use Riverpod over Provider for state management
   - Rationale: Better testing support, compile-time safety, no BuildContext required for reading state

2. **Decision**: Use flutter_secure_storage over SharedPreferences for tokens
   - Rationale: Tokens stored in platform Keychain/Keystore, not plain text

3. **Decision**: Dio over http package
   - Rationale: Built-in interceptors, better error handling, request/response transformation
