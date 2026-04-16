import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:ground_control_pro/core/network/supabase_client_provider.dart';

part 'permission_service.g.dart';

const List<String> kPermissionKeys = [
  'clients.view',
  'clients.create',
  'clients.edit',
  'clients.delete',
  'estimates.view',
  'estimates.create',
  'estimates.edit',
  'estimates.delete',
  'jobs.view',
  'jobs.create',
  'jobs.edit',
  'jobs.delete',
  'catalog.view',
  'catalog.manage',
  'employees.view',
  'employees.manage',
  'compensation.view',
  'settings.manage',
  'financials.view',
  'scheduling.view',
  'scheduling.manage',
  'fleet.view',
  'fleet.manage',
  'equipment.view',
  'equipment.schedule',
  'equipment.approve',
  'reports.view',
];

class PermissionService {
  PermissionService(this._client);

  final SupabaseClient _client;

  Future<bool> hasPermission({
    required String orgId,
    required String employeeId,
    required String permissionKey,
  }) async {
    final overridesResponse = await _client
        .from('employee_permission_overrides')
        .select('granted')
        .eq('org_id', orgId)
        .eq('employee_id', employeeId)
        .eq('permission_key', permissionKey)
        .maybeSingle();

    if (overridesResponse != null) {
      return overridesResponse['granted'] as bool? ?? false;
    }

    final employeeResponse = await _client
        .from('employees')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('id', employeeId)
        .maybeSingle();

    if (employeeResponse == null) {
      return false;
    }

    final roleId = employeeResponse['role_id'] as String;

    final rolePermissionResponse = await _client
        .from('role_permissions')
        .select('granted')
        .eq('org_id', orgId)
        .eq('role_id', roleId)
        .eq('permission_key', permissionKey)
        .maybeSingle();

    return rolePermissionResponse?['granted'] as bool? ?? false;
  }

  Future<Set<String>> getResolvedPermissions({
    required String orgId,
    required String employeeId,
  }) async {
    final employeeResponse = await _client
        .from('employees')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('id', employeeId)
        .maybeSingle();

    if (employeeResponse == null) {
      return <String>{};
    }

    final roleId = employeeResponse['role_id'] as String;

    final rolePermissionsResponse = await _client
        .from('role_permissions')
        .select('permission_key, granted')
        .eq('org_id', orgId)
        .eq('role_id', roleId);

    final overridesResponse = await _client
        .from('employee_permission_overrides')
        .select('permission_key, granted')
        .eq('org_id', orgId)
        .eq('employee_id', employeeId);

    final roleMap = <String, bool>{
      for (final row in rolePermissionsResponse as List<dynamic>)
        (row as Map<String, dynamic>)['permission_key'] as String:
            (row['granted'] as bool? ?? false),
    };

    final overrideMap = <String, bool>{
      for (final row in overridesResponse as List<dynamic>)
        (row as Map<String, dynamic>)['permission_key'] as String:
            (row['granted'] as bool? ?? false),
    };

    final resolved = <String>{};
    for (final key in kPermissionKeys) {
      final value = overrideMap.containsKey(key)
          ? (overrideMap[key] ?? false)
          : (roleMap[key] ?? false);
      if (value) {
        resolved.add(key);
      }
    }

    return resolved;
  }
}

@riverpod
PermissionService permissionService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return PermissionService(client);
}
