import 'package:freezed_annotation/freezed_annotation.dart';

part 'employee_permission_override.freezed.dart';
part 'employee_permission_override.g.dart';

@freezed
abstract class EmployeePermissionOverride with _$EmployeePermissionOverride {
  const factory EmployeePermissionOverride({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'employee_id') required String employeeId,
    @JsonKey(name: 'permission_key') required String permissionKey,
    required bool granted,
  }) = _EmployeePermissionOverride;

  factory EmployeePermissionOverride.fromJson(Map<String, dynamic> json) =>
      _$EmployeePermissionOverrideFromJson(json);
}
