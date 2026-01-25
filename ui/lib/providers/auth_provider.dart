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

/// Provider for the API client singleton.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

/// Provider for the storage service singleton.
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

/// Provider for the auth service.
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
    apiClient: ref.watch(apiClientProvider),
    storageService: ref.watch(storageServiceProvider),
  );
});

/// Notifier managing authentication state.
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthInitial());

  /// Initializes auth state by checking for stored session.
  Future<void> initialize() async {
    state = const AuthLoading();
    try {
      final user = await _authService.restoreSession();
      if (user != null) {
        state = AuthAuthenticated(user);
      } else {
        state = const AuthUnauthenticated();
      }
    } catch (e) {
      state = const AuthUnauthenticated();
    }
  }

  /// Attempts to login with credentials.
  Future<void> login(String email, String password) async {
    state = const AuthLoading();
    try {
      final user = await _authService.login(email, password);
      state = AuthAuthenticated(user);
    } on ApiException catch (e) {
      state = AuthError(e.userMessage);
    } catch (e) {
      state = const AuthError('An unexpected error occurred. Please try again.');
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    await _authService.logout();
    state = const AuthUnauthenticated();
  }

  /// Clears any error state back to unauthenticated.
  void clearError() {
    if (state is AuthError) {
      state = const AuthUnauthenticated();
    }
  }
}

/// Provider for the auth state notifier.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
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
