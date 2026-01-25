import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: VolunteerHubApp(),
    ),
  );
}

/// Root application widget.
class VolunteerHubApp extends ConsumerStatefulWidget {
  const VolunteerHubApp({super.key});

  @override
  ConsumerState<VolunteerHubApp> createState() => _VolunteerHubAppState();
}

class _VolunteerHubAppState extends ConsumerState<VolunteerHubApp> {
  @override
  void initState() {
    super.initState();
    // Initialize auth state on app start
    Future.microtask(() {
      ref.read(authProvider.notifier).initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Volunteer Hub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: const AuthGate(),
    );
  }
}

/// Widget that shows login or home based on auth state.
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return switch (authState) {
      AuthInitial() || AuthLoading() => const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        ),
      AuthAuthenticated() => const HomeScreen(),
      AuthUnauthenticated() || AuthError() => const LoginScreen(),
    };
  }
}
