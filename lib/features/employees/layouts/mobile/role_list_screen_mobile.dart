import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ground_control_pro/core/extensions/async_value_extensions.dart';
import 'package:ground_control_pro/core/routing/app_routes.dart';
import 'package:ground_control_pro/features/employees/providers/permission_provider.dart';
import 'package:ground_control_pro/features/employees/providers/role_list_provider.dart';

class RoleListScreenMobile extends ConsumerWidget {
  const RoleListScreenMobile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canManageSettingsAsync = ref.watch(
      hasPermissionProvider('settings.manage'),
    );

    if (canManageSettingsAsync.valueOrNull == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to manage roles.'),
        ),
      );
    }

    final rolesAsync = ref.watch(roleListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Roles')),
      body: rolesAsync.when(
        data: (roles) {
          if (roles.isEmpty) {
            return const Center(child: Text('No roles found'));
          }

          return ListView.separated(
            itemCount: roles.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final role = roles[index];
              return ListTile(
                title: Text(role.name),
                subtitle: Text(role.isSystem ? 'System role' : 'Custom role'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push(
                  AppRoutes.roleDetail.replaceFirst(':id', role.id),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load roles: $error')),
      ),
    );
  }
}
