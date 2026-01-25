import 'user.dart';

/// Authentication token response from login.
class AuthToken {
  final String accessToken;
  final String tokenType;
  final int expiresIn;
  final User user;

  const AuthToken({
    required this.accessToken,
    required this.tokenType,
    required this.expiresIn,
    required this.user,
  });

  factory AuthToken.fromJson(Map<String, dynamic> json) {
    return AuthToken(
      accessToken: json['accessToken'] as String,
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      expiresIn: json['expiresIn'] as int,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'tokenType': tokenType,
      'expiresIn': expiresIn,
      'user': user.toJson(),
    };
  }

  /// Returns the full Authorization header value.
  String get authorizationHeader => '$tokenType $accessToken';

  @override
  String toString() =>
      'AuthToken(type: $tokenType, expiresIn: ${expiresIn}s, user: ${user.email})';
}
