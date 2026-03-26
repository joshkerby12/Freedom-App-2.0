import 'package:freezed_annotation/freezed_annotation.dart';

part 'crew.freezed.dart';
part 'crew.g.dart';

@freezed
abstract class Crew with _$Crew {
  const factory Crew({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    @JsonKey(name: 'crew_lead_id') String? crewLeadId,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    String? notes,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Crew;

  factory Crew.fromJson(Map<String, dynamic> json) => _$CrewFromJson(json);
}

@freezed
abstract class CrewMember with _$CrewMember {
  const factory CrewMember({
    required String id,
    @JsonKey(name: 'role_id') String? roleId,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    @JsonKey(name: 'display_name') String? displayName,
    @JsonKey(name: 'employment_type') String? employmentType,
    @JsonKey(name: 'employee_status') String? employeeStatus,
  }) = _CrewMember;

  factory CrewMember.fromJson(Map<String, dynamic> json) =>
      _$CrewMemberFromJson(json);
}

@freezed
abstract class CrewSummary with _$CrewSummary {
  const factory CrewSummary({
    required Crew crew,
    String? crewLeadName,
    @Default(0) int memberCount,
  }) = _CrewSummary;

  factory CrewSummary.fromJson(Map<String, dynamic> json) =>
      _$CrewSummaryFromJson(json);
}

@freezed
abstract class CrewDetail with _$CrewDetail {
  const factory CrewDetail({
    required Crew crew,
    String? crewLeadName,
    String? crewLeadRoleName,
    @Default(<CrewMember>[]) List<CrewMember> members,
  }) = _CrewDetail;

  factory CrewDetail.fromJson(Map<String, dynamic> json) =>
      _$CrewDetailFromJson(json);
}
