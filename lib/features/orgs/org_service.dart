import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';

part 'org_service.g.dart';

class OrgMembership {
  const OrgMembership({required this.orgId, required this.role});

  final String orgId;
  final String role;
}

class OrgService {
  OrgService(this._client);

  final SupabaseClient _client;

  Future<OrgMembership?> getCurrentMembership(String profileId) async {
    final response = await _client
        .from('org_members')
        .select('org_id, role')
        .eq('profile_id', profileId)
        .limit(1)
        .maybeSingle();

    if (response == null) {
      return null;
    }

    return OrgMembership(
      orgId: response['org_id'] as String,
      role: response['role'] as String,
    );
  }

  Future<OrgMembership> createOrg({required String companyName}) async {
    final session = _client.auth.currentSession;
    final user = _client.auth.currentUser;

    if (session == null || user == null) {
      throw const AuthException('No active session');
    }

    final organization = await _client
        .from('organizations')
        .insert({'name': companyName.trim()})
        .select('id')
        .single();

    final orgId = organization['id'] as String;

    await _client.from('org_members').insert({
      'org_id': orgId,
      'profile_id': user.id,
      'role': 'owner',
    });

    await _client.from('org_settings').insert({
      'org_id': orgId,
      'company_name': companyName.trim(),
    });

    try {
      await _client.functions.invoke(
        'seed-org-data',
        body: {'org_id': orgId},
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
    } catch (error) {
      debugPrint('seed-org-data failed for org $orgId: $error');
    }

    return OrgMembership(orgId: orgId, role: 'owner');
  }
}

@riverpod
OrgService orgService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return OrgService(client);
}
