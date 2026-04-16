import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:ground_control_pro/features/employees/models/employee.dart';
import 'package:ground_control_pro/features/employees/models/employee_compensation.dart';
import 'package:ground_control_pro/features/employees/models/employee_invite.dart';
import 'package:ground_control_pro/features/employees/models/employee_permission_override.dart';
import 'package:ground_control_pro/features/employees/services/employee_service.dart';
import 'package:ground_control_pro/features/orgs/org_notifier.dart';

part 'employee_detail_provider.g.dart';

@riverpod
Future<Employee?> employeeDetail(Ref ref, String employeeId) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return null;
  }

  return ref
      .read(employeeServiceProvider)
      .getEmployeeById(orgId: org.orgId, employeeId: employeeId);
}

@riverpod
Future<List<EmployeeCompensation>> employeeCompensationHistory(
  Ref ref,
  String employeeId,
) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return <EmployeeCompensation>[];
  }

  return ref
      .read(employeeServiceProvider)
      .listCompensationHistory(orgId: org.orgId, employeeId: employeeId);
}

@riverpod
Future<EmployeeInvite?> employeeLatestInvite(Ref ref, String employeeId) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return null;
  }

  return ref
      .read(employeeServiceProvider)
      .getLatestInvite(orgId: org.orgId, employeeId: employeeId);
}

@riverpod
Future<List<EmployeePermissionOverride>> employeePermissionOverrides(
  Ref ref,
  String employeeId,
) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return <EmployeePermissionOverride>[];
  }

  return ref
      .read(employeeServiceProvider)
      .listPermissionOverrides(orgId: org.orgId, employeeId: employeeId);
}
