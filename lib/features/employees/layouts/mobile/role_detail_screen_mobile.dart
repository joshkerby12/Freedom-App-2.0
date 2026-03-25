import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:freedom_app/core/extensions/async_value_extensions.dart';
import 'package:freedom_app/core/routing/app_routes.dart';
import 'package:freedom_app/features/employees/providers/employee_list_provider.dart';
import 'package:freedom_app/features/employees/providers/permission_provider.dart';
import 'package:freedom_app/features/employees/providers/role_list_provider.dart';
import 'package:freedom_app/features/employees/services/employee_service.dart';
import 'package:freedom_app/features/employees/services/permission_service.dart';
import 'package:freedom_app/features/employees/widgets/permission_matrix_widget.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

class RoleDetailScreenMobile extends ConsumerWidget {
  const RoleDetailScreenMobile({super.key, required this.roleId});

  final String roleId;

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

    final roleAsync = ref.watch(roleDetailProvider(roleId));
    final permissionsAsync = ref.watch(rolePermissionsProvider(roleId));
    final assignedEmployeesAsync = ref.watch(
      employeeListProvider(status: 'all', roleId: roleId),
    );

    return roleAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Role')),
        body: Center(child: Text('Failed to load role: $error')),
      ),
      data: (role) {
        if (role == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Role')),
            body: const Center(child: Text('Role not found')),
          );
        }

        return Scaffold(
          appBar: AppBar(title: Text(role.name)),
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Permission Matrix',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                permissionsAsync.when(
                  data: (permissions) {
                    final currentValues = {
                      for (final permission in permissions)
                        permission.permissionKey: permission.granted,
                    };

                    return PermissionMatrixWidget(
                      permissionKeys: kPermissionKeys,
                      values: {
                        for (final key in kPermissionKeys)
                          key: currentValues[key] ?? false,
                      },
                      onToggle: (permissionKey, granted) async {
                        final org = ref.read(orgProvider).valueOrNull;
                        if (org == null) {
                          return;
                        }

                        await ref
                            .read(employeeServiceProvider)
                            .upsertRolePermission(
                              orgId: org.orgId,
                              roleId: role.id,
                              permissionKey: permissionKey,
                              granted: granted,
                            );

                        ref.invalidate(rolePermissionsProvider(role.id));
                        ref.invalidate(permissionSetProvider);
                      },
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) =>
                      Text('Failed to load permissions: $error'),
                ),
                const SizedBox(height: 16),
                Text(
                  'Employees With This Role',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                assignedEmployeesAsync.when(
                  data: (employees) {
                    if (employees.isEmpty) {
                      return const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('No employees currently assigned.'),
                        ),
                      );
                    }

                    return Card(
                      child: ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: employees.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final employee = employees[index];
                          final displayName =
                              employee.displayName?.trim().isNotEmpty == true
                              ? employee.displayName!
                              : '${employee.firstName} ${employee.lastName}'
                                    .trim();

                          return ListTile(
                            title: Text(displayName),
                            subtitle: Text(employee.employeeStatus),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push(
                              AppRoutes.employeeDetail.replaceFirst(
                                ':id',
                                employee.id,
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) => Text('Failed to load employees: $error'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
