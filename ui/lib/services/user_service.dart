import '../models/user.dart';
import 'api_client.dart';

/// Service for admin user management operations.
class UserService {
  final ApiClient _apiClient;

  UserService(this._apiClient);

  /// Fetches all users (admin only).
  Future<List<User>> getUsers() async {
    final response = await _apiClient.getList<User>(
      'users',
      fromJson: User.fromJson,
    );
    return response.data ?? [];
  }

  /// Updates a user by ID (admin only).
  Future<User> updateUser(
    String id, {
    String? email,
    String? firstName,
    String? lastName,
    UserRole? role,
  }) async {
    final data = <String, dynamic>{};
    if (email != null) data['email'] = email;
    if (firstName != null) data['firstName'] = firstName;
    if (lastName != null) data['lastName'] = lastName;
    if (role != null) data['role'] = role.value;

    final response = await _apiClient.put<User>(
      'users/$id',
      data: data,
      fromJson: User.fromJson,
    );
    return response.data!;
  }

  /// Deletes a user by ID (admin only).
  Future<void> deleteUser(String id) async {
    await _apiClient.delete('users/$id');
  }
}
