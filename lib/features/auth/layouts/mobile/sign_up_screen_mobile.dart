import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ground_control_pro/core/routing/app_routes.dart';
import 'package:ground_control_pro/features/auth/auth_notifier.dart';

class SignUpScreenMobile extends ConsumerStatefulWidget {
  const SignUpScreenMobile({super.key});

  @override
  ConsumerState<SignUpScreenMobile> createState() => _SignUpScreenMobileState();
}

class _SignUpScreenMobileState extends ConsumerState<SignUpScreenMobile> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final router = GoRouter.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final error = await ref
        .read(authProvider.notifier)
        .signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          fullName: _fullNameController.text.trim(),
        );

    if (!mounted) {
      return;
    }

    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
      return;
    }

    router.go(AppRoutes.orgSetup);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                children: [
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(labelText: 'Full Name'),
                    validator: (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return 'Full name is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                    validator: (value) {
                      final email = value?.trim() ?? '';
                      if (email.isEmpty) {
                        return 'Email is required';
                      }
                      if (!email.contains('@')) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password'),
                    validator: (value) {
                      final password = value ?? '';
                      if (password.isEmpty) {
                        return 'Password is required';
                      }
                      if (password.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Confirm Password',
                    ),
                    validator: (value) {
                      if ((value ?? '').isEmpty) {
                        return 'Confirm your password';
                      }
                      if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: authState.isLoading ? null : _submit,
                      child: const Text('Create Account'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: authState.isLoading
                        ? null
                        : () => context.go(AppRoutes.signIn),
                    child: const Text('Sign In'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
