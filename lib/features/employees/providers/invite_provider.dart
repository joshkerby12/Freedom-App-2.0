import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:freedom_app/features/employees/models/employee_invite.dart';
import 'package:freedom_app/features/employees/services/invite_service.dart';

part 'invite_provider.g.dart';

@riverpod
Future<EmployeeInvite?> inviteByToken(Ref ref, String token) {
  return ref.read(inviteServiceProvider).getInviteByToken(token);
}
