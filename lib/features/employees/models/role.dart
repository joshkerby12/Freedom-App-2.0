import 'package:freezed_annotation/freezed_annotation.dart';

part 'role.freezed.dart';
part 'role.g.dart';

@freezed
abstract class Role with _$Role {
  const factory Role({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    @JsonKey(name: 'is_system') @Default(false) bool isSystem,
    @JsonKey(name: 'sort_order') @Default(0) int sortOrder,
  }) = _Role;

  factory Role.fromJson(Map<String, dynamic> json) => _$RoleFromJson(json);
}
