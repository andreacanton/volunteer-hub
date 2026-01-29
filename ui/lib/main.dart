import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/signup_screen.dart';

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

/// Auth screen types for navigation.
enum AuthScreen {
  login,
  signup,
  forgotPassword,
  resetPassword,
}

/// Widget that shows login or home based on auth state.
class AuthGate extends ConsumerStatefulWidget {
  const AuthGate({super.key});

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> {
  AuthScreen _currentScreen = AuthScreen.login;
  String? _resetToken;

  void _navigateToLogin() {
    setState(() {
      _currentScreen = AuthScreen.login;
      _resetToken = null;
    });
  }

  void _navigateToSignup() {
    setState(() {
      _currentScreen = AuthScreen.signup;
    });
  }

  void _navigateToForgotPassword() {
    setState(() {
      _currentScreen = AuthScreen.forgotPassword;
    });
  }

  void _navigateToResetPassword(String token) {
    setState(() {
      _currentScreen = AuthScreen.resetPassword;
      _resetToken = token;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    // Handle authenticated state
    if (authState is AuthAuthenticated) {
      return const HomeScreen();
    }

    // Handle loading/initial states
    if (authState is AuthInitial || authState is AuthLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    // Handle unauthenticated states - show appropriate auth screen
    return switch (_currentScreen) {
      AuthScreen.login => LoginScreen(
          onNavigateToSignup: _navigateToSignup,
          onNavigateToForgotPassword: _navigateToForgotPassword,
        ),
      AuthScreen.signup => SignupScreen(
          onNavigateToLogin: _navigateToLogin,
        ),
      AuthScreen.forgotPassword => ForgotPasswordScreen(
          onNavigateToLogin: _navigateToLogin,
        ),
      AuthScreen.resetPassword => ResetPasswordScreen(
          token: _resetToken ?? '',
          onNavigateToLogin: _navigateToLogin,
        ),
    };
  }
}
