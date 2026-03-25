import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:freedom_app/core/network/supabase_client_provider.dart';
import 'package:freedom_app/features/employees/models/employee.dart';
import 'package:freedom_app/features/employees/models/employee_compensation.dart';
import 'package:freedom_app/features/employees/models/employee_invite.dart';
import 'package:freedom_app/features/employees/models/employee_permission_override.dart';
import 'package:freedom_app/features/employees/models/role.dart';
import 'package:freedom_app/features/employees/models/role_permission.dart';

part 'employee_service.g.dart';

class EmployeeService {
  EmployeeService(this._client);

  final SupabaseClient _client;

  Future<List<Employee>> listEmployees({
    required String orgId,
    String search = '',
    String status = 'active',
    String? roleId,
    String? crewId,
  }) async {
    dynamic query = _client.from('employees').select('*').eq('org_id', orgId);

    if (status != 'all') {
      query = query.eq('employee_status', status);
    }

    if (roleId != null && roleId.isNotEmpty) {
      query = query.eq('role_id', roleId);
    }

    if (crewId != null && crewId.isNotEmpty) {
      query = query.eq('crew_id', crewId);
    }

    final normalizedSearch = search.trim();
    if (normalizedSearch.isNotEmpty) {
      final escaped = _escapeForLike(normalizedSearch);
      query = query.or(
        'first_name.ilike.%$escaped%,last_name.ilike.%$escaped%,display_name.ilike.%$escaped%',
      );
    }

    final response = await query
        .order('last_name', ascending: true)
        .order('first_name', ascending: true);
    return (response as List<dynamic>)
        .map((item) => Employee.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Employee?> getEmployeeById({
    required String orgId,
    required String employeeId,
  }) async {
    final response = await _client
        .from('employees')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', employeeId)
        .maybeSingle();

    if (response == null) {
      return null;
    }

    return Employee.fromJson(response);
  }

  Future<Employee?> getEmployeeByAuthUserId({
    required String orgId,
    required String authUserId,
  }) async {
    final response = await _client
        .from('employees')
        .select('*')
        .eq('org_id', orgId)
        .eq('supabase_auth_uid', authUserId)
        .maybeSingle();

    if (response == null) {
      return null;
    }

    return Employee.fromJson(response);
  }

  Future<Employee> createEmployee({
    required String orgId,
    required Map<String, dynamic> values,
  }) async {
    final payload = <String, dynamic>{...values, 'org_id': orgId};

    final response = await _client
        .from('employees')
        .insert(payload)
        .select('*')
        .single();

    return Employee.fromJson(response);
  }

  Future<Employee> updateEmployee({
    required String orgId,
    required String employeeId,
    required Map<String, dynamic> values,
  }) async {
    final response = await _client
        .from('employees')
        .update(values)
        .eq('org_id', orgId)
        .eq('id', employeeId)
        .select('*')
        .single();

    return Employee.fromJson(response);
  }

  Future<EmployeeCompensation> addCompensation({
    required String orgId,
    required String employeeId,
    required String payType,
    required double payRate,
    required String effectiveDate,
    String? reason,
    String? createdBy,
  }) async {
    final response = await _client
        .from('employee_compensation')
        .insert({
          'org_id': orgId,
          'employee_id': employeeId,
          'pay_type': payType,
          'pay_rate': payRate,
          'effective_date': effectiveDate,
          'reason': reason,
          'created_by': createdBy,
        })
        .select('*')
        .single();

    return EmployeeCompensation.fromJson(response);
  }

  Future<List<EmployeeCompensation>> listCompensationHistory({
    required String orgId,
    required String employeeId,
  }) async {
    final response = await _client
        .from('employee_compensation')
        .select('*')
        .eq('org_id', orgId)
        .eq('employee_id', employeeId)
        .order('effective_date', ascending: false);

    return (response as List<dynamic>)
        .map(
          (item) => EmployeeCompensation.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  Future<List<Role>> listRoles({required String orgId}) async {
    final response = await _client
        .from('roles')
        .select('*')
        .eq('org_id', orgId)
        .order('sort_order', ascending: true)
        .order('name', ascending: true);

    return (response as List<dynamic>)
        .map((item) => Role.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<RolePermission>> listRolePermissions({
    required String orgId,
    required String roleId,
  }) async {
    final response = await _client
        .from('role_permissions')
        .select('*')
        .eq('org_id', orgId)
        .eq('role_id', roleId)
        .order('permission_key', ascending: true);

    return (response as List<dynamic>)
        .map((item) => RolePermission.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> upsertRolePermission({
    required String orgId,
    required String roleId,
    required String permissionKey,
    required bool granted,
  }) async {
    await _client.from('role_permissions').upsert({
      'org_id': orgId,
      'role_id': roleId,
      'permission_key': permissionKey,
      'granted': granted,
    }, onConflict: 'role_id,permission_key');
  }

  Future<List<EmployeePermissionOverride>> listPermissionOverrides({
    required String orgId,
    required String employeeId,
  }) async {
    final response = await _client
        .from('employee_permission_overrides')
        .select('*')
        .eq('org_id', orgId)
        .eq('employee_id', employeeId)
        .order('permission_key', ascending: true);

    return (response as List<dynamic>)
        .map(
          (item) =>
              EmployeePermissionOverride.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  Future<void> upsertPermissionOverride({
    required String orgId,
    required String employeeId,
    required String permissionKey,
    required bool granted,
  }) async {
    await _client.from('employee_permission_overrides').upsert({
      'org_id': orgId,
      'employee_id': employeeId,
      'permission_key': permissionKey,
      'granted': granted,
    }, onConflict: 'employee_id,permission_key');
  }

  Future<void> deletePermissionOverride({
    required String orgId,
    required String employeeId,
    required String permissionKey,
  }) async {
    await _client
        .from('employee_permission_overrides')
        .delete()
        .eq('org_id', orgId)
        .eq('employee_id', employeeId)
        .eq('permission_key', permissionKey);
  }

  Future<EmployeeInvite?> getLatestInvite({
    required String orgId,
    required String employeeId,
  }) async {
    final response = await _client
        .from('employee_invites')
        .select('*')
        .eq('org_id', orgId)
        .eq('employee_id', employeeId)
        .order('invited_at', ascending: false)
        .limit(1)
        .maybeSingle();

    if (response == null) {
      return null;
    }

    return EmployeeInvite.fromJson(response);
  }

  String _escapeForLike(String value) {
    return value.replaceAll('%', r'\%').replaceAll(',', ' ');
  }
}

@riverpod
EmployeeService employeeService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return EmployeeService(client);
}
