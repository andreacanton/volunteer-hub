import 'package:shared_preferences/shared_preferences.dart';

/// Storage service for sensitive data like JWT tokens.
/// Uses SharedPreferences which is web-compatible.
class StorageService {
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _tokenExpiryKey = 'token_expiry';
  static const _userKey = 'user_data';

  final SharedPreferences _prefs;

  StorageService({required SharedPreferences prefs}) : _prefs = prefs;

  /// Factory method to create an instance with SharedPreferences.
  static Future<StorageService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs: prefs);
  }

  /// Saves the authentication token.
  Future<void> saveToken(String token) async {
    await _prefs.setString(_tokenKey, token);
  }

  /// Retrieves the stored authentication token.
  Future<String?> getToken() async {
    return _prefs.getString(_tokenKey);
  }

  /// Deletes the stored authentication token.
  Future<void> deleteToken() async {
    await _prefs.remove(_tokenKey);
  }

  /// Saves the refresh token.
  Future<void> saveRefreshToken(String token) async {
    await _prefs.setString(_refreshTokenKey, token);
  }

  /// Retrieves the stored refresh token.
  Future<String?> getRefreshToken() async {
    return _prefs.getString(_refreshTokenKey);
  }

  /// Deletes the stored refresh token.
  Future<void> deleteRefreshToken() async {
    await _prefs.remove(_refreshTokenKey);
  }

  /// Saves the access token expiry time.
  Future<void> saveTokenExpiry(DateTime expiry) async {
    await _prefs.setString(_tokenExpiryKey, expiry.toIso8601String());
  }

  /// Retrieves the stored token expiry time.
  Future<DateTime?> getTokenExpiry() async {
    final expiryStr = _prefs.getString(_tokenExpiryKey);
    if (expiryStr == null) return null;
    return DateTime.tryParse(expiryStr);
  }

  /// Deletes the stored token expiry time.
  Future<void> deleteTokenExpiry() async {
    await _prefs.remove(_tokenExpiryKey);
  }

  /// Saves user data as JSON string.
  Future<void> saveUserData(String userJson) async {
    await _prefs.setString(_userKey, userJson);
  }

  /// Retrieves stored user data.
  Future<String?> getUserData() async {
    return _prefs.getString(_userKey);
  }

  /// Deletes stored user data.
  Future<void> deleteUserData() async {
    await _prefs.remove(_userKey);
  }

  /// Clears all stored data (used for logout).
  Future<void> clearAll() async {
    await _prefs.clear();
  }
}
