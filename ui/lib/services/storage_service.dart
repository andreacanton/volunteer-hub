import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Storage service for sensitive data like JWT tokens.
/// Uses FlutterSecureStorage which encrypts data via Web Crypto + IndexedDB on web.
class StorageService {
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _tokenExpiryKey = 'token_expiry';
  static const _userKey = 'user_data';

  final FlutterSecureStorage _storage;

  StorageService()
      : _storage = const FlutterSecureStorage(
          webOptions: WebOptions(
            dbName: 'volunteer_hub_secure',
            publicKey: 'volunteer_hub_key',
          ),
        );

  /// Factory method kept for compatibility with FutureProvider initialization.
  static Future<StorageService> create() async {
    return StorageService();
  }

  /// Saves the authentication token.
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  /// Retrieves the stored authentication token.
  Future<String?> getToken() async {
    return _storage.read(key: _tokenKey);
  }

  /// Deletes the stored authentication token.
  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  /// Saves the refresh token.
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  /// Retrieves the stored refresh token.
  Future<String?> getRefreshToken() async {
    return _storage.read(key: _refreshTokenKey);
  }

  /// Deletes the stored refresh token.
  Future<void> deleteRefreshToken() async {
    await _storage.delete(key: _refreshTokenKey);
  }

  /// Saves the access token expiry time.
  Future<void> saveTokenExpiry(DateTime expiry) async {
    await _storage.write(key: _tokenExpiryKey, value: expiry.toIso8601String());
  }

  /// Retrieves the stored token expiry time.
  Future<DateTime?> getTokenExpiry() async {
    final expiryStr = await _storage.read(key: _tokenExpiryKey);
    if (expiryStr == null) return null;
    return DateTime.tryParse(expiryStr);
  }

  /// Deletes the stored token expiry time.
  Future<void> deleteTokenExpiry() async {
    await _storage.delete(key: _tokenExpiryKey);
  }

  /// Saves user data as JSON string.
  Future<void> saveUserData(String userJson) async {
    await _storage.write(key: _userKey, value: userJson);
  }

  /// Retrieves stored user data.
  Future<String?> getUserData() async {
    return _storage.read(key: _userKey);
  }

  /// Deletes stored user data.
  Future<void> deleteUserData() async {
    await _storage.delete(key: _userKey);
  }

  /// Clears all stored auth data (used for logout).
  Future<void> clearAll() async {
    await deleteToken();
    await deleteRefreshToken();
    await deleteTokenExpiry();
    await deleteUserData();
  }
}
