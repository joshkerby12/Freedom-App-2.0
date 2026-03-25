import 'package:freezed_annotation/freezed_annotation.dart';

part 'employee_compensation.freezed.dart';
part 'employee_compensation.g.dart';

@freezed
abstract class EmployeeCompensation with _$EmployeeCompensation {
  const factory EmployeeCompensation({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'employee_id') required String employeeId,
    @JsonKey(name: 'pay_type') required String payType,
    @JsonKey(fromJson: _payRateFromJson, toJson: _payRateToJson)
    required double payRate,
    @JsonKey(name: 'effective_date') required String effectiveDate,
    @JsonKey(name: 'end_date') String? endDate,
    String? reason,
    @JsonKey(name: 'created_by') String? createdBy,
    @JsonKey(name: 'created_at') String? createdAt,
  }) = _EmployeeCompensation;

  factory EmployeeCompensation.fromJson(Map<String, dynamic> json) =>
      _$EmployeeCompensationFromJson(json);
}

double _payRateFromJson(Object? value) {
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

Object _payRateToJson(double value) => value;
