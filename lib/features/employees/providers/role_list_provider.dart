import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:freedom_app/features/employees/models/role.dart';
import 'package:freedom_app/features/employees/models/role_permission.dart';
import 'package:freedom_app/features/employees/services/employee_service.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

part 'role_list_provider.g.dart';

@riverpod
Future<List<Role>> roleList(Ref ref) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return <Role>[];
  }

  return ref.read(employeeServiceProvider).listRoles(orgId: org.orgId);
}

@riverpod
Future<Role?> roleDetail(Ref ref, String roleId) async {
  final roles = await ref.watch(roleListProvider.future);
  for (final role in roles) {
    if (role.id == roleId) {
      return role;
    }
  }
  return null;
}

@riverpod
Future<List<RolePermission>> rolePermissions(Ref ref, String roleId) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return <RolePermission>[];
  }

  return ref
      .read(employeeServiceProvider)
      .listRolePermissions(orgId: org.orgId, roleId: roleId);
}
