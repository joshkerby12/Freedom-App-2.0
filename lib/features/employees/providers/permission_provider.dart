import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:freedom_app/features/employees/providers/current_employee_provider.dart';
import 'package:freedom_app/features/employees/services/permission_service.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

part 'permission_provider.g.dart';

@riverpod
Future<Set<String>> permissionSet(Ref ref) async {
  final currentEmployee = await ref.watch(currentEmployeeProvider.future);
  final org = await ref.watch(orgProvider.future);

  if (currentEmployee == null || org == null) {
    return <String>{};
  }

  return ref
      .read(permissionServiceProvider)
      .getResolvedPermissions(orgId: org.orgId, employeeId: currentEmployee.id);
}

@riverpod
Future<bool> hasPermission(Ref ref, String permissionKey) async {
  final permissions = await ref.watch(permissionSetProvider.future);
  return permissions.contains(permissionKey);
}
