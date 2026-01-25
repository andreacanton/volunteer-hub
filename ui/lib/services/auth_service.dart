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
        _storageService = storageService;

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
          response.error ?? const ApiError(
            code: ApiErrorCode.internalError,
            message: 'Login failed',
          ),
        );
      }

      final authToken = response.data!;

      // Store token and user data
      await _storageService.saveToken(authToken.accessToken);
      await _storageService.saveUserData(jsonEncode(authToken.user.toJson()));

      // Set token on API client for subsequent requests
      _apiClient.setAuthToken(authToken.accessToken);

      return authToken.user;
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error as ApiException;
      }
      rethrow;
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    _apiClient.setAuthToken(null);
    await _storageService.clearAll();
  }

  /// Attempts to restore a previous session from stored token.
  /// Returns the user if a valid session exists, null otherwise.
  Future<User?> restoreSession() async {
    final token = await _storageService.getToken();
    if (token == null) return null;

    final userData = await _storageService.getUserData();
    if (userData == null) {
      await _storageService.clearAll();
      return null;
    }

    try {
      final user = User.fromJson(jsonDecode(userData) as Map<String, dynamic>);
      _apiClient.setAuthToken(token);
      return user;
    } catch (_) {
      await _storageService.clearAll();
      return null;
    }
  }

  /// Returns whether a stored session exists.
  Future<bool> hasStoredSession() async {
    final token = await _storageService.getToken();
    return token != null;
  }
}
