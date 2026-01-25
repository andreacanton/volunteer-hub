import 'package:dio/dio.dart';

import '../config/env.dart';
import '../models/api_response.dart';

/// HTTP client for API communication.
class ApiClient {
  late final Dio _dio;
  String? _authToken;

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
    _dio.interceptors.add(_ErrorInterceptor());
  }

  /// Sets the authentication token for subsequent requests.
  void setAuthToken(String? token) {
    _authToken = token;
  }

  /// Returns the current auth token.
  String? get authToken => _authToken;

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
