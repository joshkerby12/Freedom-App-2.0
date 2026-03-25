import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:freedom_app/features/auth/auth_notifier.dart';
import 'package:freedom_app/features/employees/models/employee.dart';
import 'package:freedom_app/features/employees/services/employee_service.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

part 'current_employee_provider.g.dart';

@riverpod
Future<Employee?> currentEmployee(Ref ref) async {
  final authState = ref.watch(authProvider);
  final session = authState.session;
  if (session == null) {
    return null;
  }

  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return null;
  }

  return ref
      .read(employeeServiceProvider)
      .getEmployeeByAuthUserId(orgId: org.orgId, authUserId: session.user.id);
}
