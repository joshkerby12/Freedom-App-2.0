import 'package:freezed_annotation/freezed_annotation.dart';

part 'role_permission.freezed.dart';
part 'role_permission.g.dart';

@freezed
abstract class RolePermission with _$RolePermission {
  const factory RolePermission({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'role_id') required String roleId,
    @JsonKey(name: 'permission_key') required String permissionKey,
    @Default(true) bool granted,
  }) = _RolePermission;

  factory RolePermission.fromJson(Map<String, dynamic> json) =>
      _$RolePermissionFromJson(json);
}
