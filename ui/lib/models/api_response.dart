/// Standard API response wrapper matching backend format.
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;
  final DateTime timestamp;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    required this.timestamp,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] as bool,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'] as Map<String, dynamic>)
          : null,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  /// Creates response from JSON with a list of items.
  factory ApiResponse.fromJsonList(
    Map<String, dynamic> json,
    T Function(List<dynamic>) fromJsonList,
  ) {
    return ApiResponse(
      success: json['success'] as bool,
      data: json['data'] != null ? fromJsonList(json['data'] as List) : null,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// API error details from backend.
class ApiError {
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  const ApiError({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      code: json['code'] as String,
      message: json['message'] as String,
      details: json['details'] as Map<String, dynamic>?,
    );
  }

  @override
  String toString() => 'ApiError($code): $message';
}

/// Standard error codes returned by the backend.
abstract class ApiErrorCode {
  static const validationError = 'VALIDATION_ERROR';
  static const authTokenMissing = 'AUTH_TOKEN_MISSING';
  static const authTokenInvalid = 'AUTH_TOKEN_INVALID';
  static const authTokenExpired = 'AUTH_TOKEN_EXPIRED';
  static const forbidden = 'FORBIDDEN';
  static const resourceNotFound = 'RESOURCE_NOT_FOUND';
  static const databaseError = 'DATABASE_ERROR';
  static const internalError = 'INTERNAL_ERROR';
}

/// Exception thrown when an API request fails.
class ApiException implements Exception {
  final ApiError error;
  final int? statusCode;

  const ApiException(this.error, {this.statusCode});

  @override
  String toString() => 'ApiException(${error.code}): ${error.message}';

  /// Returns a user-friendly error message.
  String get userMessage {
    switch (error.code) {
      case ApiErrorCode.validationError:
        return error.message;
      case ApiErrorCode.authTokenMissing:
      case ApiErrorCode.authTokenInvalid:
      case ApiErrorCode.authTokenExpired:
        return 'Please log in again.';
      case ApiErrorCode.forbidden:
        return 'You do not have permission to perform this action.';
      case ApiErrorCode.resourceNotFound:
        return 'The requested item was not found.';
      case ApiErrorCode.databaseError:
      case ApiErrorCode.internalError:
        return 'Something went wrong. Please try again later.';
      default:
        return error.message;
    }
  }
}
