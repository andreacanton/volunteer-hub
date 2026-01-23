/// Environment configuration for the Volunteer Hub app
class Env {
  /// Current environment mode
  static const bool isProduction = bool.fromEnvironment(
    'dart.vm.product',
    defaultValue: false,
  );

  /// Base API URL for the backend
  static String get apiBaseUrl {
    if (isProduction) {
      // TODO: Set production API URL via environment variable or build config
      return const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'https://api.volunteerhub.com/api/v1/',
      );
    } else {
      // Development environment
      return 'http://localhost:3000/api/v1/';
    }
  }

  /// JWT token expiration time (in hours)
  static const int tokenExpirationHours = 24;

  /// API request timeout (in seconds)
  static const int apiTimeoutSeconds = 30;
}
