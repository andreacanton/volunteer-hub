import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/api_response.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

/// Authentication state.
sealed class AuthState {
  const AuthState();
}

/// Initial state before checking for stored session.
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// Checking for stored session.
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// User is authenticated.
class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated(this.user);
}

/// User is not authenticated.
class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

/// Authentication error occurred.
class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

/// Registration in progress.
class AuthRegistering extends AuthState {
  const AuthRegistering();
}

/// Registration succeeded.
class AuthRegistrationSuccess extends AuthState {
  const AuthRegistrationSuccess();
}

/// Password reset email requested.
class AuthPasswordResetRequested extends AuthState {
  const AuthPasswordResetRequested();
}

/// Password reset succeeded.
class AuthPasswordResetSuccess extends AuthState {
  const AuthPasswordResetSuccess();
}

/// Provider for the API client singleton.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

/// Provider for the storage service singleton.
/// Uses FutureProvider since SharedPreferences initialization is async.
final storageServiceProvider = FutureProvider<StorageService>((ref) async {
  return StorageService.create();
});

/// Provider for the auth service.
/// Waits for storage service initialization before creating auth service.
final authServiceProvider = FutureProvider<AuthService>((ref) async {
  final storageService = await ref.watch(storageServiceProvider.future);
  return AuthService(
    apiClient: ref.watch(apiClientProvider),
    storageService: storageService,
  );
});

/// Notifier managing authentication state.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthService? _authService;
  Timer? _refreshTimer;

  /// Duration before token expiry to trigger refresh (1 minute).
  static const _refreshBuffer = Duration(minutes: 1);

  AuthNotifier(Ref ref) : super(const AuthLoading()) {
    _initWithRef(ref);
  }

  Future<void> _initWithRef(Ref ref) async {
    try {
      _authService = await ref.read(authServiceProvider.future);
      _setupSessionExpiredCallback();
      await initialize();
    } catch (e) {
      state = AuthError(e.toString());
    }
  }

  /// Sets up the callback for when the session expires.
  void _setupSessionExpiredCallback() {
    _authService?.onSessionExpired = () {
      _cancelRefreshTimer();
      state = const AuthUnauthenticated();
    };
  }

  /// Schedules a token refresh before the access token expires.
  void _scheduleTokenRefresh(DateTime expiresAt) {
    _cancelRefreshTimer();

    final now = DateTime.now();
    final refreshTime = expiresAt.subtract(_refreshBuffer);

    if (refreshTime.isBefore(now)) {
      // Token already expired or will expire very soon, refresh immediately
      _performTokenRefresh();
      return;
    }

    final delay = refreshTime.difference(now);
    _refreshTimer = Timer(delay, _performTokenRefresh);
  }

  /// Performs the token refresh.
  Future<void> _performTokenRefresh() async {
    if (_authService == null) return;

    try {
      final authToken = await _authService!.refreshToken();
      // Schedule next refresh based on new token expiry
      _scheduleTokenRefresh(authToken.expiresAt);
    } catch (e) {
      // Refresh failed - the interceptor or callback will handle logout
    }
  }

  /// Cancels any pending refresh timer.
  void _cancelRefreshTimer() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  @override
  void dispose() {
    _cancelRefreshTimer();
    super.dispose();
  }

  /// Initializes auth state by checking for stored session.
  Future<void> initialize() async {
    if (_authService == null) return;

    state = const AuthLoading();
    try {
      final user = await _authService!.restoreSession();
      if (user != null) {
        state = AuthAuthenticated(user);
        // Schedule token refresh based on stored expiry
        final expiry = await _authService!.getTokenExpiry();
        if (expiry != null) {
          _scheduleTokenRefresh(expiry);
        }
      } else {
        state = const AuthUnauthenticated();
      }
    } catch (e) {
      state = const AuthUnauthenticated();
    }
  }

  /// Attempts to login with credentials.
  Future<void> login(String email, String password) async {
    if (_authService == null) {
      state = const AuthError('Authentication service not initialized');
      return;
    }

    state = const AuthLoading();
    try {
      final user = await _authService!.login(email, password);
      state = AuthAuthenticated(user);
      // Schedule token refresh based on stored expiry
      final expiry = await _authService!.getTokenExpiry();
      if (expiry != null) {
        _scheduleTokenRefresh(expiry);
      }
    } on ApiException catch (e) {
      state = AuthError(e.userMessage);
    } catch (e) {
      state = const AuthError('An unexpected error occurred. Please try again.');
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    _cancelRefreshTimer();
    if (_authService == null) return;

    await _authService!.logout();
    state = const AuthUnauthenticated();
  }

  /// Clears any error state back to unauthenticated.
  void clearError() {
    if (state is AuthError) {
      state = const AuthUnauthenticated();
    }
  }

  /// Registers a new user account.
  Future<void> register(String email, String password) async {
    if (_authService == null) {
      state = const AuthError('Authentication service not initialized');
      return;
    }

    state = const AuthRegistering();
    try {
      await _authService!.register(email, password);
      state = const AuthRegistrationSuccess();
    } on ApiException catch (e) {
      state = AuthError(e.userMessage);
    } catch (e) {
      state = const AuthError('Registration failed. Please try again.');
    }
  }

  /// Requests a password reset email.
  Future<void> requestPasswordReset(String email) async {
    if (_authService == null) {
      state = const AuthError('Authentication service not initialized');
      return;
    }

    state = const AuthLoading();
    try {
      await _authService!.requestPasswordReset(email);
      state = const AuthPasswordResetRequested();
    } on ApiException catch (e) {
      state = AuthError(e.userMessage);
    } catch (e) {
      state = const AuthError('Password reset request failed. Please try again.');
    }
  }

  /// Resets the password using a reset token.
  Future<void> resetPassword(String token, String newPassword) async {
    if (_authService == null) {
      state = const AuthError('Authentication service not initialized');
      return;
    }

    state = const AuthLoading();
    try {
      await _authService!.resetPassword(token, newPassword);
      state = const AuthPasswordResetSuccess();
    } on ApiException catch (e) {
      state = AuthError(e.userMessage);
    } catch (e) {
      state = const AuthError('Password reset failed. Please try again.');
    }
  }

  /// Resets state to unauthenticated (used after registration success to navigate to login).
  void resetToUnauthenticated() {
    state = const AuthUnauthenticated();
  }
}

/// Provider for the auth state notifier.
/// Starts in AuthLoading and initializes asynchronously once the auth service
/// is ready, preventing state loss from provider rebuilds during initialization.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

/// Convenience provider to get the current user if authenticated.
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authProvider);
  if (authState is AuthAuthenticated) {
    return authState.user;
  }
  return null;
});

/// Convenience provider to check if user is authenticated.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider) is AuthAuthenticated;
});
