import 'package:flutter/material.dart';

import '../models/user.dart';

/// Returns the icon for a given user role.
IconData getRoleIcon(UserRole role) {
  switch (role) {
    case UserRole.admin:
      return Icons.admin_panel_settings;
    case UserRole.coordinator:
      return Icons.supervisor_account;
    case UserRole.volunteer:
      return Icons.person;
  }
}

/// Returns the display label for a given user role.
String getRoleLabel(UserRole role) {
  switch (role) {
    case UserRole.admin:
      return 'Administrator';
    case UserRole.coordinator:
      return 'Coordinator';
    case UserRole.volunteer:
      return 'Volunteer';
  }
}

/// A chip widget that displays a user role with its icon and label.
class RoleChip extends StatelessWidget {
  final UserRole role;

  const RoleChip({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(getRoleIcon(role), size: 18),
      label: Text(getRoleLabel(role)),
    );
  }
}
