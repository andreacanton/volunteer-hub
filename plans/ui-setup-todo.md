# UI Setup TODO

## Metadata
- Feature: Flutter Frontend (UI) Setup
- Plan Source: plans/ui-setup-plan.md
- Service/Repo: ui/
- Date: 2026-01-23
- Owner/Reviewer: TBD
- Links: None

## Phases

### Phase 1: Project Initialization (Goal: Create Flutter project with folder structure)
- [x] T1.1: Create Flutter project (Complexity: Simple)
  - Description: Run `flutter create` with organization `com.volunteerhub.app` in `ui/` directory
  - Dependencies: none
  - Acceptance: `flutter run` shows default app
  - Notes: Use `flutter create --org com.volunteerhub ui`

- [x] T1.2: Create folder structure (Complexity: Simple)
  - Description: Clean default files and create folders: models/, services/, providers/, screens/, widgets/, config/, utils/
  - Dependencies: T1.1
  - Acceptance: All folders exist under `ui/lib/`
  - Notes: Remove default counter app code

- [x] T1.3: Configure analysis options (Complexity: Simple)
  - Description: Set up analysis_options.yaml with effective_dart lints
  - Dependencies: T1.1
  - Acceptance: `flutter analyze` passes with no issues
  - Notes: None

### Phase 2: Dependencies Setup (Goal: Install and configure core packages)
- [x] T2.1: Add dependencies to pubspec.yaml (Complexity: Simple)
  - Description: Add dio, flutter_riverpod, flutter_secure_storage, and related packages
  - Dependencies: T1.1
  - Acceptance: `flutter pub get` succeeds
  - Notes: Packages: dio, flutter_riverpod, riverpod_annotation, flutter_secure_storage

- [x] T2.2: Create environment configuration (Complexity: Simple)
  - Description: Create env.dart with dev/prod API URL configuration
  - Dependencies: T2.1
  - Acceptance: Dev URL is `http://localhost:3000/api/v1/`, prod URL configurable
  - Notes: File: `ui/lib/config/env.dart`

### Phase 3: Core Infrastructure (Goal: API client and base services)
- [ ] T3.1: Create ApiResponse and ApiError models (Complexity: Medium)
  - Description: Create data models matching backend response format with JSON serialization
  - Dependencies: T1.2
  - Acceptance: Models parse backend JSON correctly
  - Notes: File: `ui/lib/models/api_response.dart`

- [ ] T3.2: Create User and AuthToken models (Complexity: Medium)
  - Description: Create User model with UserRole enum and AuthToken model
  - Dependencies: T3.1
  - Acceptance: JSON serialization/deserialization works
  - Notes: Files: `ui/lib/models/user.dart`, `ui/lib/models/auth_token.dart`

- [ ] T3.3: Implement ApiClient with Dio (Complexity: Medium)
  - Description: Create Dio-based HTTP client with base URL, timeout, error handling
  - Dependencies: T3.1, T2.2
  - Acceptance: Can make HTTP requests to backend
  - Notes: File: `ui/lib/services/api_client.dart`

- [ ] T3.4: Add auth interceptor to ApiClient (Complexity: Medium)
  - Description: Add Dio interceptor that attaches JWT token to requests and handles token expiry
  - Dependencies: T3.3
  - Acceptance: Token auto-attached to authenticated requests
  - Notes: Integrate with storage service once available

### Phase 4: Authentication (Goal: Login flow with secure storage)
- [ ] T4.1: Implement secure token storage (Complexity: Simple)
  - Description: Create StorageService using flutter_secure_storage for JWT tokens
  - Dependencies: T2.1
  - Acceptance: Can save, read, and delete token from secure storage
  - Notes: File: `ui/lib/services/storage_service.dart`

- [ ] T4.2: Create AuthService (Complexity: Medium)
  - Description: Implement login/logout methods that call API and manage token storage
  - Dependencies: T3.3, T4.1
  - Acceptance: Login stores token, logout clears token
  - Notes: File: `ui/lib/services/auth_service.dart`

- [ ] T4.3: Create AuthProvider with Riverpod (Complexity: Medium)
  - Description: Create Riverpod provider for auth state (logged in/out, current user)
  - Dependencies: T4.2
  - Acceptance: Auth state is reactive and updates UI automatically
  - Notes: File: `ui/lib/providers/auth_provider.dart`

### Phase 5: UI Implementation (Goal: Login screen and app shell)
- [ ] T5.1: Create app theme configuration (Complexity: Simple)
  - Description: Define Material 3 theme with color scheme
  - Dependencies: T1.2
  - Acceptance: Theme applied consistently across app
  - Notes: File: `ui/lib/config/theme.dart`

- [ ] T5.2: Create LoginScreen with form (Complexity: Medium)
  - Description: Build login screen with email/password fields, validation, submit button
  - Dependencies: T4.3, T5.1
  - Acceptance: Form validates input, shows validation errors
  - Notes: File: `ui/lib/screens/login_screen.dart`

- [ ] T5.3: Create HomeScreen placeholder (Complexity: Simple)
  - Description: Create basic home screen showing logged-in user info
  - Dependencies: T5.1
  - Acceptance: Displays user name and role after login
  - Notes: File: `ui/lib/screens/home_screen.dart`

- [ ] T5.4: Setup app routing and shell (Complexity: Medium)
  - Description: Configure main.dart with ProviderScope, routing between login/home based on auth
  - Dependencies: T5.2, T5.3
  - Acceptance: Redirects to login when unauthenticated, home when authenticated
  - Notes: File: `ui/lib/main.dart`

### Phase 6: Integration & Polish (Goal: Wire everything together)
- [ ] T6.1: Connect login form to AuthProvider (Complexity: Simple)
  - Description: Wire form submit to call AuthProvider.login()
  - Dependencies: T5.2, T4.3
  - Acceptance: Form submission triggers API login call
  - Notes: None

- [ ] T6.2: Add loading states and error handling (Complexity: Medium)
  - Description: Show loading spinner during login, display API errors in SnackBar
  - Dependencies: T6.1
  - Acceptance: Loading indicator visible, errors shown to user
  - Notes: Use error mapping table from plan

- [ ] T6.3: Verify end-to-end flow (Complexity: Simple)
  - Description: Manual testing of full login flow against backend
  - Dependencies: All previous tasks
  - Acceptance: Can login with test credentials, see home screen, logout
  - Notes: Requires backend running; document any issues found

## Rollup
- Open Tasks: 13
- Completed Tasks: 5
- Blockers: none
- Next Priority: T3.1

## Notes
- Backend auth endpoint not yet implemented; UI work can proceed with planned contract
- Tests are out of scope for this phase (separate phase later)
- Target platforms: iOS and Android only (no web)
