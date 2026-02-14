import 'dart:convert';

import 'package:dio/dio.dart';

import '../models/api_response.dart';
import '../models/auth_token.dart';
import '../models/user.dart';
import 'api_client.dart';
import 'storage_service.dart';

/// Service handling authentication operations.
class AuthService {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthService({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService {
    // Set up token refresh callbacks
    _apiClient.onTokensRefreshed = _handleTokensRefreshed;
    _apiClient.onRefreshFailed = _handleRefreshFailed;
  }

  /// Callback for when tokens are automatically refreshed by the interceptor.
  void Function(User user)? onSessionRestored;

  /// Callback for when token refresh fails (session expired).
  void Function()? onSessionExpired;

  /// Handles tokens being refreshed by the interceptor.
  void _handleTokensRefreshed(AuthToken authToken) {
    // Persist the new tokens
    _storageService.saveToken(authToken.accessToken);
    _storageService.saveRefreshToken(authToken.refreshToken);
    _storageService.saveTokenExpiry(authToken.expiresAt);
    _storageService.saveUserData(jsonEncode(authToken.user.toJson()));
  }

  /// Handles token refresh failure.
  void _handleRefreshFailed() {
    // Clear all stored data
    _apiClient.clearTokens();
    _storageService.clearAll();
    onSessionExpired?.call();
  }

  /// Registers a new user account.
  /// Returns true on success, throws ApiException on error.
  Future<void> register(String email, String password) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        'auth/register',
        data: {'email': email, 'password': password},
      );

      if (!response.success) {
        throw ApiException(
          response.error ??
              const ApiError(
                code: ApiErrorCode.internalError,
                message: 'Registration failed',
              ),
        );
      }
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Attempts to login with email and password.
  /// Returns the authenticated user on success.
  Future<User> login(String email, String password) async {
    try {
      final response = await _apiClient.post<AuthToken>(
        'auth/login',
        data: {'email': email, 'password': password},
        fromJson: AuthToken.fromJson,
      );

      if (!response.success || response.data == null) {
        throw ApiException(
          response.error ??
              const ApiError(
                code: ApiErrorCode.internalError,
                message: 'Login failed',
              ),
        );
      }

      final authToken = response.data!;

      // Store tokens and user data
      await _storageService.saveToken(authToken.accessToken);
      await _storageService.saveRefreshToken(authToken.refreshToken);
      await _storageService.saveTokenExpiry(authToken.expiresAt);
      await _storageService.saveUserData(jsonEncode(authToken.user.toJson()));

      // Set tokens on API client for subsequent requests
      _apiClient.setAuthToken(authToken.accessToken);
      _apiClient.setRefreshToken(authToken.refreshToken);

      return authToken.user;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Manually refreshes the access token using the stored refresh token.
  /// Returns the new AuthToken on success.
  Future<AuthToken> refreshToken() async {
    final storedRefreshToken = await _storageService.getRefreshToken();
    if (storedRefreshToken == null) {
      throw const ApiException(
        ApiError(
          code: ApiErrorCode.authTokenMissing,
          message: 'No refresh token available',
        ),
      );
    }

    try {
      final response = await _apiClient.post<AuthToken>(
        'auth/refresh',
        data: {'refreshToken': storedRefreshToken},
        fromJson: AuthToken.fromJson,
      );

      if (!response.success || response.data == null) {
        // Clear tokens on refresh failure
        await _storageService.clearAll();
        _apiClient.clearTokens();

        throw ApiException(
          response.error ??
              const ApiError(
                code: ApiErrorCode.authTokenInvalid,
                message: 'Token refresh failed',
              ),
        );
      }

      final authToken = response.data!;

      // Store new tokens
      await _storageService.saveToken(authToken.accessToken);
      await _storageService.saveRefreshToken(authToken.refreshToken);
      await _storageService.saveTokenExpiry(authToken.expiresAt);
      await _storageService.saveUserData(jsonEncode(authToken.user.toJson()));

      // Update API client
      _apiClient.setAuthToken(authToken.accessToken);
      _apiClient.setRefreshToken(authToken.refreshToken);

      return authToken;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Requests a password reset email.
  /// Always succeeds to prevent email enumeration.
  Future<void> requestPasswordReset(String email) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        'auth/forgot-password',
        data: {'email': email},
      );

      if (!response.success) {
        throw ApiException(
          response.error ??
              const ApiError(
                code: ApiErrorCode.internalError,
                message: 'Password reset request failed',
              ),
        );
      }
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Resets the password using a reset token.
  Future<void> resetPassword(String token, String newPassword) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        'auth/reset-password',
        data: {'token': token, 'password': newPassword},
      );

      if (!response.success) {
        throw ApiException(
          response.error ??
              const ApiError(
                code: ApiErrorCode.internalError,
                message: 'Password reset failed',
              ),
        );
      }
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    final storedRefreshToken = await _storageService.getRefreshToken();

    // Call logout endpoint if we have a refresh token
    if (storedRefreshToken != null) {
      try {
        await _apiClient.post<Map<String, dynamic>>(
          'auth/logout',
          data: {'refreshToken': storedRefreshToken},
        );
      } catch (_) {
        // Ignore logout errors - still clear local state
      }
    }

    _apiClient.clearTokens();
    await _storageService.clearAll();
  }

  /// Attempts to restore a previous session from stored tokens.
  /// Returns the user if a valid session exists, null otherwise.
  Future<User?> restoreSession() async {
    final token = await _storageService.getToken();
    if (token == null) return null;

    final refreshToken = await _storageService.getRefreshToken();
    final userData = await _storageService.getUserData();
    final tokenExpiry = await _storageService.getTokenExpiry();

    if (userData == null) {
      await _storageService.clearAll();
      return null;
    }

    try {
      final user = User.fromJson(jsonDecode(userData) as Map<String, dynamic>);

      // Set tokens on API client
      _apiClient.setAuthToken(token);
      _apiClient.setRefreshToken(refreshToken);

      // If token is expired or will expire soon, try to refresh
      if (tokenExpiry != null && DateTime.now().isAfter(tokenExpiry)) {
        if (refreshToken != null) {
          try {
            final authToken = await this.refreshToken();
            return authToken.user;
          } catch (_) {
            // Refresh failed, clear and return null
            await _storageService.clearAll();
            _apiClient.clearTokens();
            return null;
          }
        } else {
          // No refresh token, clear and return null
          await _storageService.clearAll();
          _apiClient.clearTokens();
          return null;
        }
      }

      return user;
    } catch (_) {
      await _storageService.clearAll();
      _apiClient.clearTokens();
      return null;
    }
  }

  /// Returns whether a stored session exists.
  Future<bool> hasStoredSession() async {
    final token = await _storageService.getToken();
    return token != null;
  }

  /// Returns the current access token expiry time, if available.
  Future<DateTime?> getTokenExpiry() async {
    return _storageService.getTokenExpiry();
  }
}
