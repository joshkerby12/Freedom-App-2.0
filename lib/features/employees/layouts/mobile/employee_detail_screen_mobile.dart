import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:ground_control_pro/core/extensions/async_value_extensions.dart';
import 'package:ground_control_pro/core/routing/app_routes.dart';
import 'package:ground_control_pro/features/employees/models/employee_invite.dart';
import 'package:ground_control_pro/features/employees/helpers/employee_calculations.dart';
import 'package:ground_control_pro/features/employees/models/employee_permission_override.dart';
import 'package:ground_control_pro/features/employees/providers/current_employee_provider.dart';
import 'package:ground_control_pro/features/employees/providers/employee_detail_provider.dart';
import 'package:ground_control_pro/features/employees/providers/permission_provider.dart';
import 'package:ground_control_pro/features/employees/providers/role_list_provider.dart';
import 'package:ground_control_pro/features/employees/services/employee_service.dart';
import 'package:ground_control_pro/features/employees/services/invite_service.dart';
import 'package:ground_control_pro/features/employees/services/permission_service.dart';
import 'package:ground_control_pro/features/employees/widgets/compensation_section_widget.dart';
import 'package:ground_control_pro/features/orgs/org_notifier.dart';

class EmployeeDetailScreenMobile extends ConsumerWidget {
  const EmployeeDetailScreenMobile({super.key, required this.employeeId});

  final String employeeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canViewAsync = ref.watch(hasPermissionProvider('employees.view'));
    final canManageAsync = ref.watch(hasPermissionProvider('employees.manage'));
    final canViewCompAsync = ref.watch(
      hasPermissionProvider('compensation.view'),
    );
    final canManageSettingsAsync = ref.watch(
      hasPermissionProvider('settings.manage'),
    );

    if (canViewAsync.valueOrNull == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view employees.'),
        ),
      );
    }

    final employeeAsync = ref.watch(employeeDetailProvider(employeeId));
    final compensationAsync = ref.watch(
      employeeCompensationHistoryProvider(employeeId),
    );
    final inviteAsync = ref.watch(employeeLatestInviteProvider(employeeId));
    final overridesAsync = ref.watch(
      employeePermissionOverridesProvider(employeeId),
    );

    return employeeAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Employee')),
        body: Center(child: Text('Failed to load employee: $error')),
      ),
      data: (employee) {
        if (employee == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Employee')),
            body: const Center(child: Text('Employee not found')),
          );
        }

        final roles = ref.watch(roleListProvider).valueOrNull ?? [];
        var roleName = '—';
        for (final role in roles) {
          if (role.id == employee.roleId) {
            roleName = role.name;
            break;
          }
        }

        final canManage = canManageAsync.valueOrNull == true;
        final canViewComp = canViewCompAsync.valueOrNull == true;
        final canManageSettings = canManageSettingsAsync.valueOrNull == true;

        return Scaffold(
          appBar: AppBar(
            title: Text(resolvedDisplayName(employee)),
            actions: [
              if (canManage)
                IconButton(
                  tooltip: 'Edit employee',
                  onPressed: () => context.push(
                    AppRoutes.employeeEdit.replaceFirst(':id', employee.id),
                  ),
                  icon: const Icon(Icons.edit),
                ),
            ],
          ),
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          resolvedDisplayName(employee),
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text('$roleName • ${employee.employeeStatus}'),
                        const SizedBox(height: 8),
                        Text(
                          employee.companyEmail ??
                              employee.personalEmail ??
                              'No email on file',
                        ),
                        if ((employee.phone ?? '').isNotEmpty)
                          Text(employee.phone ?? ''),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  title: 'Personal Info',
                  children: [
                    _DataRow(label: 'First Name', value: employee.firstName),
                    _DataRow(label: 'Last Name', value: employee.lastName),
                    _DataRow(
                      label: 'Display Name',
                      value: employee.displayName,
                    ),
                    _DataRow(
                      label: 'Personal Email',
                      value: employee.personalEmail,
                    ),
                    _DataRow(
                      label: 'Company Email',
                      value: employee.companyEmail,
                    ),
                    _DataRow(label: 'Phone', value: employee.phone),
                    _DataRow(label: 'Address', value: employee.address),
                    _DataRow(label: 'Birthday', value: employee.birthday),
                    _DataRow(label: 'Start Date', value: employee.startDate),
                    _DataRow(label: 'End Date', value: employee.endDate),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  title: 'Employment',
                  children: [
                    _DataRow(label: 'Title', value: employee.employeeTitle),
                    _DataRow(
                      label: 'Position',
                      value: employee.employeePosition,
                    ),
                    _DataRow(label: 'Type', value: employee.employmentType),
                    _DataRow(label: 'Status', value: employee.employeeStatus),
                    _DataRow(
                      label: 'Vehicle Insurance',
                      value: employee.onVehicleInsurance ? 'Yes' : 'No',
                    ),
                    _DataRow(
                      label: 'Has Company Card',
                      value: employee.hasCompanyCard ? 'Yes' : 'No',
                    ),
                    _DataRow(
                      label: 'Card Last Four',
                      value: employee.companyCardLastFour,
                    ),
                    _DataRow(
                      label: 'Sales Employee',
                      value: employee.isSales ? 'Yes' : 'No',
                    ),
                    _DataRow(
                      label: 'Tracks Hours',
                      value: employee.tracksHours ? 'Yes' : 'No',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  title: 'Driver Info',
                  children: [
                    _DataRow(
                      label: 'License Number',
                      value: employee.driversLicenseNumber,
                    ),
                    _DataRow(
                      label: 'License State',
                      value: employee.driversLicenseState,
                    ),
                    _DataRow(
                      label: 'License Class',
                      value: employee.driversLicenseClass,
                    ),
                    _DataRow(
                      label: 'License Expiry',
                      value: employee.driversLicenseExpiry,
                    ),
                    _DataRow(
                      label: 'Medical Card Expiry',
                      value: employee.medicalCardExpiry,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Compensation',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                CompensationSectionWidget(
                  canView: canViewComp,
                  history: compensationAsync.valueOrNull ?? const [],
                ),
                const SizedBox(height: 12),
                _InviteSection(
                  employeeId: employee.id,
                  fallbackEmail:
                      employee.companyEmail ?? employee.personalEmail ?? '',
                  inviteStatus: inviteAsync.valueOrNull,
                ),
                if (canManageSettings) ...[
                  const SizedBox(height: 12),
                  _PermissionOverrideSection(
                    employeeId: employee.id,
                    roleId: employee.roleId,
                    overrides: overridesAsync.valueOrNull ?? const [],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _InviteSection extends ConsumerWidget {
  const _InviteSection({
    required this.employeeId,
    required this.fallbackEmail,
    required this.inviteStatus,
  });

  final String employeeId;
  final String fallbackEmail;
  final EmployeeInvite? inviteStatus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final org = ref.watch(orgProvider).valueOrNull;
    final currentEmployee = ref.watch(currentEmployeeProvider).valueOrNull;

    final status = inviteStatus?.status;

    Future<void> sendInvite() async {
      if (org == null || fallbackEmail.trim().isEmpty) {
        return;
      }
      await ref
          .read(inviteServiceProvider)
          .sendInvite(
            orgId: org.orgId,
            employeeId: employeeId,
            email: fallbackEmail,
            invitedBy: currentEmployee?.id,
            orgName: org.orgId,
          );
      ref.invalidate(employeeLatestInviteProvider(employeeId));
    }

    Future<void> revokeInvite() async {
      final inviteId = inviteStatus?.id;
      if (org == null || inviteId == null) {
        return;
      }
      await ref
          .read(inviteServiceProvider)
          .revokeInvite(orgId: org.orgId, inviteId: inviteId);
      ref.invalidate(employeeLatestInviteProvider(employeeId));
    }

    return _SectionCard(
      title: 'Invite Status',
      children: [
        _DataRow(label: 'Invite Email', value: fallbackEmail),
        _DataRow(label: 'Status', value: status ?? 'Not invited'),
        Row(
          children: [
            if (status == null || status == 'revoked' || status == 'expired')
              FilledButton(
                onPressed: fallbackEmail.trim().isEmpty ? null : sendInvite,
                child: Text(status == null ? 'Send Invite' : 'Resend Invite'),
              ),
            if (status == 'pending') ...[
              FilledButton.tonal(
                onPressed: revokeInvite,
                child: const Text('Revoke Invite'),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _PermissionOverrideSection extends ConsumerWidget {
  const _PermissionOverrideSection({
    required this.employeeId,
    required this.roleId,
    required this.overrides,
  });

  final String employeeId;
  final String roleId;
  final List<EmployeePermissionOverride> overrides;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final org = ref.watch(orgProvider).valueOrNull;
    final rolePermissionsAsync = ref.watch(rolePermissionsProvider(roleId));

    return _SectionCard(
      title: 'Permission Overrides',
      children: [
        rolePermissionsAsync.when(
          data: (rolePermissions) {
            final roleDefaults = {
              for (final permission in rolePermissions)
                permission.permissionKey: permission.granted,
            };
            final overrideMap = {
              for (final override in overrides)
                override.permissionKey: override,
            };

            return Column(
              children: kPermissionKeys.map((key) {
                final roleValue = roleDefaults[key] ?? false;
                final override = overrideMap[key];
                final effective = override?.granted ?? roleValue;

                return SwitchListTile(
                  dense: true,
                  title: Text(key),
                  subtitle: Text(
                    override == null
                        ? 'Role default: ${roleValue ? 'Granted' : 'Denied'}'
                        : 'Using override (${override.granted ? 'Granted' : 'Denied'})',
                  ),
                  value: effective,
                  onChanged: org == null
                      ? null
                      : (value) async {
                          final service = ref.read(employeeServiceProvider);

                          if (value == roleValue) {
                            await service.deletePermissionOverride(
                              orgId: org.orgId,
                              employeeId: employeeId,
                              permissionKey: key,
                            );
                          } else {
                            await service.upsertPermissionOverride(
                              orgId: org.orgId,
                              employeeId: employeeId,
                              permissionKey: key,
                              granted: value,
                            );
                          }

                          ref.invalidate(
                            employeePermissionOverridesProvider(employeeId),
                          );
                          ref.invalidate(permissionSetProvider);
                        },
                );
              }).toList(),
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: CircularProgressIndicator(),
          ),
          error: (error, _) => Text('Failed to load permissions: $error'),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _DataRow extends StatelessWidget {
  const _DataRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(value?.trim().isNotEmpty == true ? value! : '—'),
          ),
        ],
      ),
    );
  }
}
