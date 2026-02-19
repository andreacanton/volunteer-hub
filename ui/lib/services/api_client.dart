import 'dart:async';

import 'package:dio/dio.dart';

import '../config/env.dart';
import '../models/api_response.dart';
import '../models/auth_token.dart';

/// Callback type for when tokens are refreshed.
typedef TokensRefreshedCallback = Future<void> Function(AuthToken authToken);

/// Callback type for when token refresh fails.
typedef RefreshFailedCallback = void Function();

/// HTTP client for API communication.
class ApiClient {
  late final Dio _dio;
  String? _authToken;
  String? _refreshToken;

  /// Called when tokens are successfully refreshed.
  TokensRefreshedCallback? onTokensRefreshed;

  /// Called when token refresh fails (e.g., refresh token expired).
  RefreshFailedCallback? onRefreshFailed;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(seconds: Env.apiTimeoutSeconds),
        receiveTimeout: const Duration(seconds: Env.apiTimeoutSeconds),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(_AuthInterceptor(this));
    _dio.interceptors.add(_TokenRefreshInterceptor(this));
    _dio.interceptors.add(_ErrorInterceptor());
  }

  /// Sets the authentication token for subsequent requests.
  void setAuthToken(String? token) {
    _authToken = token;
  }

  /// Returns the current auth token.
  String? get authToken => _authToken;

  /// Sets the refresh token for token refresh operations.
  void setRefreshToken(String? token) {
    _refreshToken = token;
  }

  /// Returns the current refresh token.
  String? get refreshToken => _refreshToken;

  /// Clears both tokens (for logout).
  void clearTokens() {
    _authToken = null;
    _refreshToken = null;
  }

  /// Performs a GET request.
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      path,
      queryParameters: queryParameters,
    );
    return ApiResponse.fromJson(response.data!, fromJson);
  }

  /// Performs a GET request expecting a list response.
  Future<ApiResponse<List<T>>> getList<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(Map<String, dynamic>) fromJson,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      path,
      queryParameters: queryParameters,
    );
    return ApiResponse.fromJsonList(
      response.data!,
      (list) => list.map((e) => fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  /// Performs a POST request.
  Future<ApiResponse<T>> post<T>(
    String path, {
    Map<String, dynamic>? data,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      path,
      data: data,
    );
    return ApiResponse.fromJson(response.data!, fromJson);
  }

  /// Performs a PUT request.
  Future<ApiResponse<T>> put<T>(
    String path, {
    Map<String, dynamic>? data,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _dio.put<Map<String, dynamic>>(
      path,
      data: data,
    );
    return ApiResponse.fromJson(response.data!, fromJson);
  }

  /// Performs a DELETE request.
  Future<ApiResponse<T>> delete<T>(
    String path, {
    Map<String, dynamic>? data,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _dio.delete<Map<String, dynamic>>(
      path,
      data: data,
    );
    return ApiResponse.fromJson(response.data!, fromJson);
  }
}

/// Interceptor that attaches auth token to requests.
class _AuthInterceptor extends Interceptor {
  final ApiClient _client;

  _AuthInterceptor(this._client);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _client.authToken;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

/// Interceptor that handles automatic token refresh on 401 errors.
class _TokenRefreshInterceptor extends Interceptor {
  final ApiClient _client;

  /// Lock to prevent multiple concurrent refresh attempts.
  bool _isRefreshing = false;

  /// Completer for pending requests waiting for refresh to complete.
  Completer<void>? _refreshCompleter;

  _TokenRefreshInterceptor(this._client);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Only handle 401 errors for non-auth endpoints
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Skip refresh for auth endpoints (login, refresh, etc.)
    final path = err.requestOptions.path;
    if (path.contains('auth/login') ||
        path.contains('auth/refresh') ||
        path.contains('auth/register')) {
      return handler.next(err);
    }

    // No refresh token available, can't refresh
    final refreshToken = _client.refreshToken;
    if (refreshToken == null) {
      return handler.next(err);
    }

    try {
      // Wait for any ongoing refresh to complete
      if (_isRefreshing) {
        await _refreshCompleter?.future;
        // Retry with new token
        final response = await _retryRequest(err.requestOptions);
        return handler.resolve(response);
      }

      // Start refresh
      _isRefreshing = true;
      _refreshCompleter = Completer<void>();

      final success = await _attemptTokenRefresh(refreshToken);

      if (success) {
        _refreshCompleter?.complete();
        _isRefreshing = false;
        _refreshCompleter = null;

        // Retry the original request with new token
        final response = await _retryRequest(err.requestOptions);
        return handler.resolve(response);
      } else {
        _refreshCompleter?.completeError('Refresh failed');
        _isRefreshing = false;
        _refreshCompleter = null;

        // Notify about refresh failure (triggers logout)
        _client.onRefreshFailed?.call();
        return handler.next(err);
      }
    } catch (e) {
      _isRefreshing = false;
      _refreshCompleter?.completeError(e);
      _refreshCompleter = null;
      return handler.next(err);
    }
  }

  /// Attempts to refresh the access token.
  Future<bool> _attemptTokenRefresh(String refreshToken) async {
    try {
      // Create a separate Dio instance to avoid interceptor loops
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      final response = await refreshDio.post<Map<String, dynamic>>(
        'auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.data?['success'] == true && response.data?['data'] != null) {
        final authToken = AuthToken.fromJson(
          response.data!['data'] as Map<String, dynamic>,
        );

        // Update tokens in the client
        _client.setAuthToken(authToken.accessToken);
        _client.setRefreshToken(authToken.refreshToken);

        // Notify listeners about the new tokens (awaited so storage persists before retry)
        await _client.onTokensRefreshed?.call(authToken);

        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /// Retries a request with the updated auth token.
  Future<Response<dynamic>> _retryRequest(RequestOptions options) async {
    // Update the authorization header with the new token
    options.headers['Authorization'] = 'Bearer ${_client.authToken}';

    return _client._dio.fetch(options);
  }
}

/// Interceptor that handles API errors.
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.data is Map<String, dynamic>) {
      final data = err.response!.data as Map<String, dynamic>;
      if (data['error'] != null) {
        final apiError = ApiError.fromJson(data['error'] as Map<String, dynamic>);
        handler.reject(
          DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            error: ApiException(apiError, statusCode: err.response?.statusCode),
          ),
        );
        return;
      }
    }

    // Handle network errors
    ApiError apiError;
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        apiError = const ApiError(
          code: 'NETWORK_TIMEOUT',
          message: 'Request timed out. Please check your connection.',
        );
        break;
      case DioExceptionType.connectionError:
        apiError = const ApiError(
          code: 'NETWORK_ERROR',
          message: 'Unable to connect. Please check your internet connection.',
        );
        break;
      default:
        apiError = ApiError(
          code: ApiErrorCode.internalError,
          message: err.message ?? 'An unexpected error occurred.',
        );
    }

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        error: ApiException(apiError, statusCode: err.response?.statusCode),
      ),
    );
  }
}
