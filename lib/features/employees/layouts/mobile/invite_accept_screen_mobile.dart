import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:freedom_app/core/routing/app_routes.dart';
import 'package:freedom_app/features/employees/providers/invite_provider.dart';
import 'package:freedom_app/features/employees/services/invite_service.dart';

class InviteAcceptScreenMobile extends ConsumerStatefulWidget {
  const InviteAcceptScreenMobile({super.key, required this.token});

  final String token;

  @override
  ConsumerState<InviteAcceptScreenMobile> createState() =>
      _InviteAcceptScreenMobileState();
}

class _InviteAcceptScreenMobileState
    extends ConsumerState<InviteAcceptScreenMobile> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _submitting = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inviteAsync = ref.watch(inviteByTokenProvider(widget.token));

    return Scaffold(
      appBar: AppBar(title: const Text('Accept Invite')),
      body: SafeArea(
        child: inviteAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) =>
              Center(child: Text('Failed to load invite: $error')),
          data: (invite) {
            if (invite == null) {
              return const Center(
                child: Text('This invite link is expired or invalid.'),
              );
            }

            final expiresAt = DateTime.tryParse(invite.expiresAt);
            final expired =
                expiresAt == null || expiresAt.isBefore(DateTime.now().toUtc());
            final invalidStatus = invite.status != 'pending';

            if (expired || invalidStatus) {
              return const Center(
                child: Text('This invite link is expired or invalid.'),
              );
            }

            return Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Welcome to Freedom Landscapes',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text('Email: ${invite.email}'),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password'),
                      validator: (value) {
                        if ((value ?? '').length < 8) {
                          return 'Password must be at least 8 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Confirm Password',
                      ),
                      validator: (value) {
                        if (value != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: const Text('Accept Invite'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      await ref
          .read(inviteServiceProvider)
          .acceptInvite(
            token: widget.token,
            password: _passwordController.text,
          );

      if (!mounted) {
        return;
      }

      context.go(AppRoutes.dashboard);
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not accept invite: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
