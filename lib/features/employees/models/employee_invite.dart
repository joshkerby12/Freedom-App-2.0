import 'package:freezed_annotation/freezed_annotation.dart';

part 'employee_invite.freezed.dart';
part 'employee_invite.g.dart';

@freezed
abstract class EmployeeInvite with _$EmployeeInvite {
  const factory EmployeeInvite({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'employee_id') required String employeeId,
    required String email,
    required String token,
    required String status,
    @JsonKey(name: 'invited_by') String? invitedBy,
    @JsonKey(name: 'invited_at') String? invitedAt,
    @JsonKey(name: 'accepted_at') String? acceptedAt,
    @JsonKey(name: 'expires_at') required String expiresAt,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _EmployeeInvite;

  factory EmployeeInvite.fromJson(Map<String, dynamic> json) =>
      _$EmployeeInviteFromJson(json);
}
