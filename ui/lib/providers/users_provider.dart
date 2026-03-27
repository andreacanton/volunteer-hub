import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/api_response.dart';
import '../models/user.dart';
import '../services/user_service.dart';
import 'auth_provider.dart';

/// Users list state.
sealed class UsersState {
  const UsersState();
}

class UsersInitial extends UsersState {
  const UsersInitial();
}

class UsersLoading extends UsersState {
  const UsersLoading();
}

class UsersLoaded extends UsersState {
  final List<User> users;
  const UsersLoaded(this.users);
}

class UsersError extends UsersState {
  final String message;
  const UsersError(this.message);
}

/// Provider for the user service.
final userServiceProvider = Provider<UserService>((ref) {
  return UserService(ref.watch(apiClientProvider));
});

/// Notifier managing users list state.
class UsersNotifier extends StateNotifier<UsersState> {
  final UserService _userService;

  UsersNotifier(this._userService) : super(const UsersInitial());

  Future<void> loadUsers() async {
    state = const UsersLoading();
    try {
      final users = await _userService.getUsers();
      state = UsersLoaded(users);
    } on DioException catch (e) {
      final apiException = e.error;
      if (apiException is ApiException) {
        state = UsersError(apiException.userMessage);
      } else {
        state = const UsersError('Failed to load users.');
      }
    } catch (e) {
      state = const UsersError('Failed to load users.');
    }
  }

  Future<void> updateUser(
    String id, {
    String? email,
    String? firstName,
    String? lastName,
    UserRole? role,
  }) async {
    try {
      final updated = await _userService.updateUser(
        id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
      );
      // Optimistic local update
      final current = state;
      if (current is UsersLoaded) {
        state = UsersLoaded(
          current.users.map((u) => u.id == id ? updated : u).toList(),
        );
      }
    } on DioException catch (e) {
      final apiException = e.error;
      if (apiException is ApiException) {
        throw apiException;
      }
      rethrow;
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await _userService.deleteUser(id);
      // Optimistic local removal
      final current = state;
      if (current is UsersLoaded) {
        state = UsersLoaded(
          current.users.where((u) => u.id != id).toList(),
        );
      }
    } on DioException catch (e) {
      final apiException = e.error;
      if (apiException is ApiException) {
        throw apiException;
      }
      rethrow;
    }
  }
}

/// Provider for the users state.
final usersProvider = StateNotifierProvider<UsersNotifier, UsersState>((ref) {
  return UsersNotifier(ref.watch(userServiceProvider));
});
