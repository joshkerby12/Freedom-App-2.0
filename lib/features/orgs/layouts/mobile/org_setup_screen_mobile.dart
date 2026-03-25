import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:freedom_app/core/routing/app_routes.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

class OrgSetupScreenMobile extends ConsumerStatefulWidget {
  const OrgSetupScreenMobile({super.key});

  @override
  ConsumerState<OrgSetupScreenMobile> createState() =>
      _OrgSetupScreenMobileState();
}

class _OrgSetupScreenMobileState extends ConsumerState<OrgSetupScreenMobile> {
  final _formKey = GlobalKey<FormState>();
  final _companyNameController = TextEditingController();

  @override
  void dispose() {
    _companyNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final router = GoRouter.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final result = await ref
        .read(orgProvider.notifier)
        .createOrg(_companyNameController.text.trim());

    if (!mounted) {
      return;
    }

    if (result == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Unable to create organization.')),
      );
      return;
    }

    router.go(AppRoutes.dashboard);
  }

  @override
  Widget build(BuildContext context) {
    final orgState = ref.watch(orgProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Set Up Organization')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Set up your company to get started'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _companyNameController,
                  decoration: const InputDecoration(labelText: 'Company Name'),
                  validator: (value) {
                    final name = value?.trim() ?? '';
                    if (name.isEmpty) {
                      return 'Company name is required';
                    }
                    if (name.length > 100) {
                      return 'Company name must be 100 characters or less';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: orgState.isLoading ? null : _submit,
                    child: const Text('Create My Company'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
