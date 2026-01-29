import 'user.dart';

/// Authentication token response from login/refresh.
class AuthToken {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;
  final DateTime expiresAt;
  final User user;

  const AuthToken({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.expiresIn,
    required this.expiresAt,
    required this.user,
  });

  factory AuthToken.fromJson(Map<String, dynamic> json) {
    final expiresIn = json['expiresIn'] as int? ?? 900; // Default 15 min
    return AuthToken(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      expiresIn: expiresIn,
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'tokenType': tokenType,
      'expiresIn': expiresIn,
      'expiresAt': expiresAt.toIso8601String(),
      'user': user.toJson(),
    };
  }

  /// Creates an AuthToken from stored JSON (includes expiresAt as string).
  factory AuthToken.fromStoredJson(Map<String, dynamic> json) {
    return AuthToken(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      expiresIn: json['expiresIn'] as int,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  /// Returns the full Authorization header value.
  String get authorizationHeader => '$tokenType $accessToken';

  /// Returns true if the access token is expired or will expire soon (within 1 minute).
  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// Returns true if the access token will expire within the given duration.
  bool expiresWithin(Duration duration) =>
      DateTime.now().add(duration).isAfter(expiresAt);

  @override
  String toString() =>
      'AuthToken(type: $tokenType, expiresIn: ${expiresIn}s, user: ${user.email})';
}
