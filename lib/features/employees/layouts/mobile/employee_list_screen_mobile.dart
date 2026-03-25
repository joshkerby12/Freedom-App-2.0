import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:freedom_app/core/extensions/async_value_extensions.dart';
import 'package:freedom_app/core/routing/app_routes.dart';
import 'package:freedom_app/features/employees/helpers/employee_calculations.dart';
import 'package:freedom_app/features/employees/models/role.dart';
import 'package:freedom_app/features/employees/providers/employee_list_provider.dart';
import 'package:freedom_app/features/employees/providers/permission_provider.dart';
import 'package:freedom_app/features/employees/providers/role_list_provider.dart';

class EmployeeListScreenMobile extends ConsumerStatefulWidget {
  const EmployeeListScreenMobile({super.key});

  @override
  ConsumerState<EmployeeListScreenMobile> createState() =>
      _EmployeeListScreenMobileState();
}

class _EmployeeListScreenMobileState
    extends ConsumerState<EmployeeListScreenMobile> {
  final _searchController = TextEditingController();

  String _status = 'active';
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canViewAsync = ref.watch(hasPermissionProvider('employees.view'));
    final canManageAsync = ref.watch(hasPermissionProvider('employees.manage'));
    final rolesAsync = ref.watch(roleListProvider);

    final canView = canViewAsync.valueOrNull ?? false;
    if (!canView) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view employees.'),
        ),
      );
    }

    final employeesAsync = ref.watch(
      employeeListProvider(search: _search, status: _status),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Employees')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  labelText: 'Search employees',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) {
                  setState(() {
                    _search = value.trim();
                  });
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  _StatusChip(
                    label: 'All',
                    value: 'all',
                    selected: _status == 'all',
                    onSelected: _onStatusChanged,
                  ),
                  _StatusChip(
                    label: 'Active',
                    value: 'active',
                    selected: _status == 'active',
                    onSelected: _onStatusChanged,
                  ),
                  _StatusChip(
                    label: 'On Leave',
                    value: 'on_leave',
                    selected: _status == 'on_leave',
                    onSelected: _onStatusChanged,
                  ),
                  _StatusChip(
                    label: 'Terminated',
                    value: 'terminated',
                    selected: _status == 'terminated',
                    onSelected: _onStatusChanged,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: employeesAsync.when(
                  data: (employees) {
                    if (employees.isEmpty) {
                      return const Center(child: Text('No employees yet'));
                    }

                    final rolesById = {
                      for (final role in rolesAsync.valueOrNull ?? <Role>[])
                        role.id: role,
                    };

                    return ListView.separated(
                      itemCount: employees.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final employee = employees[index];
                        final roleName =
                            rolesById[employee.roleId]?.name ?? '—';
                        final status = employee.employeeStatus;

                        return ListTile(
                          title: Text(resolvedDisplayName(employee)),
                          subtitle: Text(
                            '$roleName • ${employee.employmentType ?? '—'}',
                          ),
                          trailing: _StatusBadge(status: status),
                          onTap: () => context.push(
                            AppRoutes.employeeDetail.replaceFirst(
                              ':id',
                              employee.id,
                            ),
                          ),
                        );
                      },
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) =>
                      Center(child: Text('Failed to load: $error')),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: canManageAsync.valueOrNull == true
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.employeeNew),
              icon: const Icon(Icons.add),
              label: const Text('Add Employee'),
            )
          : null,
    );
  }

  void _onStatusChanged(String value) {
    setState(() {
      _status = value;
    });
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final String value;
  final bool selected;
  final void Function(String value) onSelected;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(value),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'active':
        color = Colors.green;
        break;
      case 'on_leave':
        color = Colors.orange;
        break;
      default:
        color = Colors.grey;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.circle, color: color, size: 12),
        const SizedBox(width: 6),
        Text(status.replaceAll('_', ' ')),
      ],
    );
  }
}
