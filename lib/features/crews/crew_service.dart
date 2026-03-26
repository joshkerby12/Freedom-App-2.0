import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'models/crew.dart';

part 'crew_service.g.dart';

class CrewService {
  CrewService(this._client);

  final SupabaseClient _client;

  Future<List<CrewSummary>> listCrews({required String orgId}) async {
    final crewRows = await _client
        .from('crews')
        .select('*')
        .eq('org_id', orgId)
        .order('name', ascending: true);

    final crews = (crewRows as List)
        .cast<Map<String, dynamic>>()
        .map(Crew.fromJson)
        .toList();

    if (crews.isEmpty) {
      return const <CrewSummary>[];
    }

    final crewIds = crews.map((crew) => crew.id).toList();

    final memberRows = await _client
        .from('employees')
        .select('id,crew_id,first_name,last_name,display_name')
        .eq('org_id', orgId)
        .inFilter('crew_id', crewIds);

    final membersByCrewId = <String, int>{};
    final namesById = <String, String>{};

    for (final row in (memberRows as List).cast<Map<String, dynamic>>()) {
      final crewId = row['crew_id'] as String?;
      if (crewId != null) {
        membersByCrewId[crewId] = (membersByCrewId[crewId] ?? 0) + 1;
      }

      final employeeId = row['id'] as String?;
      if (employeeId != null) {
        namesById[employeeId] = _resolvedEmployeeName(row);
      }
    }

    return crews
        .map(
          (crew) => CrewSummary(
            crew: crew,
            crewLeadName: crew.crewLeadId == null
                ? null
                : namesById[crew.crewLeadId!],
            memberCount: membersByCrewId[crew.id] ?? 0,
          ),
        )
        .toList();
  }

  Future<CrewDetail?> getCrewDetail({
    required String orgId,
    required String crewId,
  }) async {
    final crewRow = await _client
        .from('crews')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', crewId)
        .maybeSingle();

    if (crewRow == null) {
      return null;
    }

    final crew = Crew.fromJson(crewRow);

    final memberRows = await _client
        .from('employees')
        .select(
          'id,role_id,first_name,last_name,display_name,employment_type,employee_status',
        )
        .eq('org_id', orgId)
        .eq('crew_id', crewId)
        .order('last_name', ascending: true)
        .order('first_name', ascending: true);

    final members = (memberRows as List)
        .cast<Map<String, dynamic>>()
        .map(CrewMember.fromJson)
        .toList();

    final rolesRows = await _client
        .from('roles')
        .select('id,name')
        .eq('org_id', orgId);

    final roleById = <String, String>{};
    for (final row in (rolesRows as List).cast<Map<String, dynamic>>()) {
      final id = row['id'] as String?;
      final name = row['name'] as String?;
      if (id != null && name != null) {
        roleById[id] = name;
      }
    }

    String? crewLeadName;
    String? crewLeadRoleName;

    if (crew.crewLeadId != null) {
      final leadRow = await _client
          .from('employees')
          .select('id,role_id,first_name,last_name,display_name')
          .eq('org_id', orgId)
          .eq('id', crew.crewLeadId!)
          .maybeSingle();

      if (leadRow != null) {
        crewLeadName = _resolvedEmployeeName(leadRow);
        final roleId = leadRow['role_id'] as String?;
        if (roleId != null) {
          crewLeadRoleName = roleById[roleId];
        }
      }
    }

    return CrewDetail(
      crew: crew,
      crewLeadName: crewLeadName,
      crewLeadRoleName: crewLeadRoleName,
      members: members,
    );
  }

  Future<List<Map<String, String>>> listCrewLeadOptions({
    required String orgId,
  }) async {
    final rows = await _client
        .from('employees')
        .select('id,first_name,last_name,display_name,employee_status')
        .eq('org_id', orgId)
        .eq('employee_status', 'active')
        .order('last_name', ascending: true)
        .order('first_name', ascending: true);

    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(
          (row) => {
            'id': row['id'] as String,
            'name': _resolvedEmployeeName(row),
          },
        )
        .toList();
  }

  Future<Crew> createCrew({
    required String orgId,
    required String name,
    String? crewLeadId,
    bool isActive = true,
    String? notes,
  }) async {
    final row = await _client
        .from('crews')
        .insert({
          'org_id': orgId,
          'name': name,
          'crew_lead_id': _nullIfBlank(crewLeadId),
          'is_active': isActive,
          'notes': _nullIfBlank(notes),
        })
        .select('*')
        .single();

    return Crew.fromJson(row);
  }

  Future<Crew> updateCrew({
    required String orgId,
    required String crewId,
    required String name,
    String? crewLeadId,
    required bool isActive,
    String? notes,
  }) async {
    final row = await _client
        .from('crews')
        .update({
          'name': name,
          'crew_lead_id': _nullIfBlank(crewLeadId),
          'is_active': isActive,
          'notes': _nullIfBlank(notes),
        })
        .eq('org_id', orgId)
        .eq('id', crewId)
        .select('*')
        .single();

    return Crew.fromJson(row);
  }

  String? _nullIfBlank(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }
    return trimmed;
  }

  String _resolvedEmployeeName(Map<String, dynamic> employeeRow) {
    final displayName = (employeeRow['display_name'] as String?)?.trim();
    if (displayName != null && displayName.isNotEmpty) {
      return displayName;
    }

    final firstName = (employeeRow['first_name'] as String?)?.trim() ?? '';
    final lastName = (employeeRow['last_name'] as String?)?.trim() ?? '';

    final fullName = '$firstName $lastName'.trim();
    if (fullName.isNotEmpty) {
      return fullName;
    }

    return 'Unnamed Employee';
  }
}

@riverpod
CrewService crewService(Ref ref) {
  return CrewService(ref.read(supabaseClientProvider));
}
