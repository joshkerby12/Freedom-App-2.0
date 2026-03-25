import 'package:freezed_annotation/freezed_annotation.dart';

part 'employee.freezed.dart';
part 'employee.g.dart';

@freezed
abstract class Employee with _$Employee {
  const factory Employee({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'supabase_auth_uid') String? supabaseAuthUid,
    @JsonKey(name: 'role_id') required String roleId,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    @JsonKey(name: 'display_name') String? displayName,
    @JsonKey(name: 'personal_email') String? personalEmail,
    @JsonKey(name: 'company_email') String? companyEmail,
    String? phone,
    String? address,
    String? birthday,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'end_date') String? endDate,
    @JsonKey(name: 'employee_title') String? employeeTitle,
    @JsonKey(name: 'employee_position') String? employeePosition,
    @JsonKey(name: 'employment_type') String? employmentType,
    @JsonKey(name: 'employee_status') @Default('active') String employeeStatus,
    @JsonKey(name: 'crew_id') String? crewId,
    @JsonKey(name: 'on_vehicle_insurance')
    @Default(false)
    bool onVehicleInsurance,
    @JsonKey(name: 'has_company_card') @Default(false) bool hasCompanyCard,
    @JsonKey(name: 'company_card_last_four') String? companyCardLastFour,
    @JsonKey(name: 'is_sales') @Default(false) bool isSales,
    @JsonKey(name: 'tracks_hours') @Default(true) bool tracksHours,
    @JsonKey(name: 'drivers_license_number') String? driversLicenseNumber,
    @JsonKey(name: 'drivers_license_state') String? driversLicenseState,
    @JsonKey(name: 'drivers_license_class') String? driversLicenseClass,
    @JsonKey(name: 'drivers_license_expiry') String? driversLicenseExpiry,
    @JsonKey(name: 'medical_card_expiry') String? medicalCardExpiry,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _Employee;

  factory Employee.fromJson(Map<String, dynamic> json) =>
      _$EmployeeFromJson(json);
}
