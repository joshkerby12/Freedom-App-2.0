import 'dart:math';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;

import 'package:freedom_app/core/network/supabase_client_provider.dart';
import 'package:freedom_app/features/employees/models/employee_invite.dart';

part 'invite_service.g.dart';

class InviteService {
  InviteService(this._client);

  final supa.SupabaseClient _client;

  Future<EmployeeInvite> sendInvite({
    required String orgId,
    required String employeeId,
    required String email,
    String? invitedBy,
    String? orgName,
  }) async {
    final token = _buildToken();
    final expiresAt = DateTime.now().toUtc().add(const Duration(days: 7));

    final response = await _client
        .from('employee_invites')
        .insert({
          'org_id': orgId,
          'employee_id': employeeId,
          'email': email.trim(),
          'token': token,
          'status': 'pending',
          'invited_by': invitedBy,
          'expires_at': expiresAt.toIso8601String(),
        })
        .select('*')
        .single();

    final session = _client.auth.currentSession;
    if (session != null) {
      await _client.functions.invoke(
        'send-employee-invite',
        body: {
          'employee_id': employeeId,
          'email': email.trim(),
          'token': token,
          'org_name': orgName,
        },
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
    }

    return EmployeeInvite.fromJson(response);
  }

  Future<void> revokeInvite({
    required String orgId,
    required String inviteId,
  }) async {
    await _client
        .from('employee_invites')
        .update({'status': 'revoked'})
        .eq('org_id', orgId)
        .eq('id', inviteId);
  }

  Future<EmployeeInvite?> getInviteByToken(String token) async {
    final response = await _client
        .from('employee_invites')
        .select('*')
        .eq('token', token)
        .maybeSingle();

    if (response == null) {
      return null;
    }

    return EmployeeInvite.fromJson(response);
  }

  Future<void> acceptInvite({
    required String token,
    required String password,
  }) async {
    final invite = await getInviteByToken(token);
    if (invite == null) {
      throw Exception('Invite not found');
    }

    final expiry = DateTime.tryParse(invite.expiresAt);
    final isExpired = expiry == null || expiry.isBefore(DateTime.now().toUtc());
    if (isExpired || invite.status != 'pending') {
      throw Exception('Invite is expired or invalid');
    }

    final signup = await _client.auth.signUp(
      email: invite.email,
      password: password,
      data: {'full_name': invite.email.split('@').first},
    );

    final user = signup.user ?? _client.auth.currentUser;
    if (user == null) {
      throw Exception('Could not create account for invite');
    }

    await _client
        .from('employees')
        .update({'supabase_auth_uid': user.id})
        .eq('org_id', invite.orgId)
        .eq('id', invite.employeeId);

    await _client
        .from('employee_invites')
        .update({
          'status': 'accepted',
          'accepted_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('org_id', invite.orgId)
        .eq('id', invite.id);

    final membership = await _client
        .from('org_members')
        .select('id')
        .eq('org_id', invite.orgId)
        .eq('profile_id', user.id)
        .maybeSingle();

    if (membership == null) {
      await _client.from('org_members').insert({
        'org_id': invite.orgId,
        'profile_id': user.id,
        'role': 'member',
      });
    }
  }

  String _buildToken() {
    final random = Random.secure();
    final values = List<int>.generate(32, (_) => random.nextInt(256));
    return values.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
  }
}

@riverpod
InviteService inviteService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return InviteService(client);
}
