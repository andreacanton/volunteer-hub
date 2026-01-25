import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure storage service for sensitive data like JWT tokens.
class StorageService {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_data';

  final FlutterSecureStorage _storage;

  StorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

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

  /// Clears all stored data (used for logout).
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
