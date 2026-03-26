import 'package:freezed_annotation/freezed_annotation.dart';

part 'fleet_models.freezed.dart';
part 'fleet_models.g.dart';

List<String>? _defectsFromJson(dynamic value) {
  if (value is List) {
    return value.whereType<String>().toList();
  }
  return null;
}

@freezed
abstract class Equipment with _$Equipment {
  const factory Equipment({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    required String type,
    String? make,
    String? model,
    int? year,
    @JsonKey(name: 'vin_serial') String? vinSerial,
    @JsonKey(name: 'license_plate') String? licensePlate,
    @JsonKey(name: 'dot_number') String? dotNumber,
    @JsonKey(name: 'registration_expiry') DateTime? registrationExpiry,
    @JsonKey(name: 'insurance_expiry') DateTime? insuranceExpiry,
    @JsonKey(name: 'annual_inspection_due') DateTime? annualInspectionDue,
    @Default(false) @JsonKey(name: 'is_shareable') bool isShareable,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    String? notes,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Equipment;

  factory Equipment.fromJson(Map<String, dynamic> json) =>
      _$EquipmentFromJson(json);
}

@freezed
abstract class EquipmentAssignment with _$EquipmentAssignment {
  const factory EquipmentAssignment({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    @JsonKey(name: 'crew_id') required String crewId,
    @JsonKey(name: 'assigned_date') required DateTime assignedDate,
    String? notes,
    @JsonKey(name: 'crew_name') String? crewName,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _EquipmentAssignment;

  factory EquipmentAssignment.fromJson(Map<String, dynamic> json) =>
      _$EquipmentAssignmentFromJson(json);
}

@freezed
abstract class EquipmentSchedule with _$EquipmentSchedule {
  const factory EquipmentSchedule({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    @JsonKey(name: 'crew_id') String? crewId,
    @JsonKey(name: 'job_id') String? jobId,
    @JsonKey(name: 'start_date') required DateTime startDate,
    @JsonKey(name: 'end_date') DateTime? endDate,
    String? notes,
    @JsonKey(name: 'crew_name') String? crewName,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _EquipmentSchedule;

  factory EquipmentSchedule.fromJson(Map<String, dynamic> json) =>
      _$EquipmentScheduleFromJson(json);
}

@freezed
abstract class EquipmentRequest with _$EquipmentRequest {
  const factory EquipmentRequest({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    @JsonKey(name: 'crew_id') required String crewId,
    @JsonKey(name: 'job_id') String? jobId,
    @JsonKey(name: 'requested_by') String? requestedBy,
    @JsonKey(name: 'start_date') required DateTime startDate,
    @JsonKey(name: 'end_date') DateTime? endDate,
    required String status,
    @JsonKey(name: 'reviewed_by') String? reviewedBy,
    @JsonKey(name: 'reviewed_at') DateTime? reviewedAt,
    String? notes,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _EquipmentRequest;

  factory EquipmentRequest.fromJson(Map<String, dynamic> json) =>
      _$EquipmentRequestFromJson(json);
}

@freezed
abstract class EquipmentMaintenance with _$EquipmentMaintenance {
  const factory EquipmentMaintenance({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    required String type,
    @JsonKey(name: 'performed_date') required DateTime performedDate,
    int? mileage,
    @JsonKey(name: 'next_service_date') DateTime? nextServiceDate,
    @JsonKey(name: 'next_service_mileage') int? nextServiceMileage,
    @JsonKey(name: 'performed_by') String? performedBy,
    double? cost,
    String? notes,
    @JsonKey(name: 'receipt_url') String? receiptUrl,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _EquipmentMaintenance;

  factory EquipmentMaintenance.fromJson(Map<String, dynamic> json) =>
      _$EquipmentMaintenanceFromJson(json);
}

@freezed
abstract class VehicleInspection with _$VehicleInspection {
  const factory VehicleInspection({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    @JsonKey(name: 'driver_id') required String driverId,
    @JsonKey(name: 'inspection_type') required String inspectionType,
    @JsonKey(name: 'inspection_date') required DateTime inspectionDate,
    int? odometer,
    required bool passed,
    @JsonKey(name: 'defects', fromJson: _defectsFromJson) List<String>? defects,
    @JsonKey(name: 'driver_signature') String? driverSignature,
    String? notes,
    @JsonKey(name: 'driver_name') String? driverName,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _VehicleInspection;

  factory VehicleInspection.fromJson(Map<String, dynamic> json) =>
      _$VehicleInspectionFromJson(json);
}

@freezed
abstract class EquipmentDetail with _$EquipmentDetail {
  const factory EquipmentDetail({
    required Equipment equipment,
    EquipmentAssignment? currentAssignment,
    @Default(<EquipmentAssignment>[]) List<EquipmentAssignment> assignments,
    @Default(<EquipmentSchedule>[]) List<EquipmentSchedule> schedule,
    @Default(<EquipmentMaintenance>[]) List<EquipmentMaintenance> maintenance,
    @Default(<VehicleInspection>[]) List<VehicleInspection> inspections,
  }) = _EquipmentDetail;

  factory EquipmentDetail.fromJson(Map<String, dynamic> json) =>
      _$EquipmentDetailFromJson(json);
}
