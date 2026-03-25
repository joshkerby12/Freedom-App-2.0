import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:freedom_app/features/employees/models/employee.dart';
import 'package:freedom_app/features/employees/services/employee_service.dart';
import 'package:freedom_app/features/orgs/org_notifier.dart';

part 'employee_list_provider.g.dart';

@riverpod
Future<List<Employee>> employeeList(
  Ref ref, {
  String search = '',
  String status = 'active',
  String? roleId,
  String? crewId,
}) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return <Employee>[];
  }

  return ref
      .read(employeeServiceProvider)
      .listEmployees(
        orgId: org.orgId,
        search: search,
        status: status,
        roleId: roleId,
        crewId: crewId,
      );
}
