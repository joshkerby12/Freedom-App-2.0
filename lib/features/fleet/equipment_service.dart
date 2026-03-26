import 'dart:typed_data';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'models/fleet_models.dart';

part 'equipment_service.g.dart';

class EquipmentUpsertRequest {
  const EquipmentUpsertRequest({
    required this.name,
    required this.type,
    this.make,
    this.model,
    this.year,
    this.vinSerial,
    this.licensePlate,
    this.dotNumber,
    this.registrationExpiry,
    this.insuranceExpiry,
    this.annualInspectionDue,
    this.isShareable = false,
    this.isActive = true,
    this.notes,
  });

  final String name;
  final String type;
  final String? make;
  final String? model;
  final int? year;
  final String? vinSerial;
  final String? licensePlate;
  final String? dotNumber;
  final DateTime? registrationExpiry;
  final DateTime? insuranceExpiry;
  final DateTime? annualInspectionDue;
  final bool isShareable;
  final bool isActive;
  final String? notes;
}

class EquipmentRequestCreate {
  const EquipmentRequestCreate({
    required this.equipmentId,
    required this.crewId,
    required this.requestedBy,
    required this.startDate,
    this.endDate,
    this.jobId,
    this.notes,
  });

  final String equipmentId;
  final String crewId;
  final String? requestedBy;
  final DateTime startDate;
  final DateTime? endDate;
  final String? jobId;
  final String? notes;
}

class EquipmentService {
  EquipmentService(this._client);

  final SupabaseClient _client;

  Future<List<Equipment>> listEquipment({
    required String orgId,
    String search = '',
    String type = 'all',
    bool includeInactive = true,
    bool hasExpiryAlert = false,
    bool inactiveOnly = false,
  }) async {
    dynamic query = _client.from('equipment').select('*').eq('org_id', orgId);

    if (type != 'all') {
      query = query.eq('type', type);
    }

    if (inactiveOnly) {
      query = query.eq('is_active', false);
    } else if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    final normalizedSearch = search.trim();
    if (normalizedSearch.isNotEmpty) {
      final escaped = _escapeForLike(normalizedSearch);
      query = query.or(
        'name.ilike.%$escaped%,make.ilike.%$escaped%,model.ilike.%$escaped%,vin_serial.ilike.%$escaped%,license_plate.ilike.%$escaped%',
      );
    }

    final rows = await query
        .order('type', ascending: true)
        .order('name', ascending: true);

    final equipment = (rows as List)
        .cast<Map<String, dynamic>>()
        .map(Equipment.fromJson)
        .toList();

    if (!hasExpiryAlert) {
      return equipment;
    }

    return equipment.where(_hasExpiryAlert).toList();
  }

  Future<EquipmentDetail?> getEquipmentDetail({
    required String orgId,
    required String equipmentId,
  }) async {
    final equipmentRow = await _client
        .from('equipment')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', equipmentId)
        .maybeSingle();

    if (equipmentRow == null) {
      return null;
    }

    final assignmentRows = await _client
        .from('equipment_assignments')
        .select('*, crews(name)')
        .eq('org_id', orgId)
        .eq('equipment_id', equipmentId)
        .order('assigned_date', ascending: false);

    final assignments = (assignmentRows as List)
        .cast<Map<String, dynamic>>()
        .map(
          (row) => EquipmentAssignment.fromJson({
            ...row,
            'crew_name': (row['crews'] as Map<String, dynamic>?)?['name'],
          }),
        )
        .toList();

    final today = _dateOnly(DateTime.now());
    final scheduleRows = await _client
        .from('equipment_schedule')
        .select('*, crews(name)')
        .eq('org_id', orgId)
        .eq('equipment_id', equipmentId)
        .gte('start_date', _asYmd(today))
        .order('start_date', ascending: true);

    final schedule = (scheduleRows as List)
        .cast<Map<String, dynamic>>()
        .map(
          (row) => EquipmentSchedule.fromJson({
            ...row,
            'crew_name': (row['crews'] as Map<String, dynamic>?)?['name'],
          }),
        )
        .toList();

    final maintenanceRows = await _client
        .from('equipment_maintenance')
        .select('*')
        .eq('org_id', orgId)
        .eq('equipment_id', equipmentId)
        .order('performed_date', ascending: false);

    final maintenance = (maintenanceRows as List)
        .cast<Map<String, dynamic>>()
        .map(EquipmentMaintenance.fromJson)
        .toList();

    final inspectionRows = await _client
        .from('vehicle_inspections')
        .select('*, employees(first_name,last_name,display_name)')
        .eq('org_id', orgId)
        .eq('equipment_id', equipmentId)
        .order('inspection_date', ascending: false);

    final inspections = (inspectionRows as List)
        .cast<Map<String, dynamic>>()
        .map(
          (row) => VehicleInspection.fromJson({
            ...row,
            'driver_name': _resolvedEmployeeName(
              row['employees'] as Map<String, dynamic>?,
            ),
          }),
        )
        .toList();

    return EquipmentDetail(
      equipment: Equipment.fromJson(equipmentRow),
      assignments: assignments,
      currentAssignment: assignments.isEmpty ? null : assignments.first,
      schedule: schedule,
      maintenance: maintenance,
      inspections: inspections,
    );
  }

  Future<Equipment> createEquipment({
    required String orgId,
    required EquipmentUpsertRequest request,
  }) async {
    final row = await _client
        .from('equipment')
        .insert(_equipmentWriteMap(orgId: orgId, request: request))
        .select('*')
        .single();

    return Equipment.fromJson(row);
  }

  Future<Equipment> updateEquipment({
    required String orgId,
    required String equipmentId,
    required EquipmentUpsertRequest request,
  }) async {
    final row = await _client
        .from('equipment')
        .update(_equipmentWriteMap(orgId: orgId, request: request))
        .eq('org_id', orgId)
        .eq('id', equipmentId)
        .select('*')
        .single();

    return Equipment.fromJson(row);
  }

  Future<bool> checkAvailability({
    required String orgId,
    required String equipmentId,
    required DateTime startDate,
    DateTime? endDate,
    String? excludeScheduleId,
  }) async {
    final row = await _client
        .from('equipment')
        .select('is_active,is_shareable')
        .eq('org_id', orgId)
        .eq('id', equipmentId)
        .maybeSingle();

    if (row == null) {
      return false;
    }

    final isActive = row['is_active'] as bool? ?? false;
    if (!isActive) {
      return false;
    }

    final isShareable = row['is_shareable'] as bool? ?? false;
    if (isShareable) {
      return true;
    }

    final start = _dateOnly(startDate);
    final end = _dateOnly(endDate ?? startDate);

    try {
      final conflict = await _client.rpc(
        'has_equipment_schedule_conflict',
        params: {
          'check_org_id': orgId,
          'check_equipment_id': equipmentId,
          'check_start_date': _asYmd(start),
          'check_end_date': _asYmd(end),
          'exclude_schedule_id': excludeScheduleId,
        },
      );

      if (conflict is bool) {
        return !conflict;
      }
    } catch (_) {
      // Fall back to direct overlap query if RPC is unavailable.
    }

    dynamic query = _client
        .from('equipment_schedule')
        .select('id')
        .eq('org_id', orgId)
        .eq('equipment_id', equipmentId)
        .lte('start_date', _asYmd(end))
        .or('end_date.is.null,end_date.gte.${_asYmd(start)}');

    if (excludeScheduleId != null && excludeScheduleId.isNotEmpty) {
      query = query.neq('id', excludeScheduleId);
    }

    final overlaps = await query;
    return (overlaps as List).isEmpty;
  }

  String getExpiryStatus(DateTime? date, {DateTime? today}) {
    if (date == null) {
      return 'ok';
    }

    final now = _dateOnly(today ?? DateTime.now());
    final expiryDate = _dateOnly(date);
    final daysUntilExpiry = expiryDate.difference(now).inDays;

    if (daysUntilExpiry < 0) {
      return 'expired';
    }

    if (daysUntilExpiry <= 30) {
      return 'critical';
    }

    if (daysUntilExpiry <= 60) {
      return 'warning';
    }

    return 'ok';
  }

  Future<EquipmentRequest> submitEquipmentRequest({
    required String orgId,
    required EquipmentRequestCreate request,
  }) async {
    final inserted = await _client
        .from('equipment_requests')
        .insert({
          'org_id': orgId,
          'equipment_id': request.equipmentId,
          'crew_id': request.crewId,
          'requested_by': request.requestedBy,
          'start_date': _asYmd(request.startDate),
          'end_date': request.endDate == null ? null : _asYmd(request.endDate!),
          'job_id': _nullIfBlank(request.jobId),
          'notes': _nullIfBlank(request.notes),
          'status': 'pending',
        })
        .select('*')
        .single();

    final requestModel = EquipmentRequest.fromJson(inserted);

    final settingsRow = await _client
        .from('org_settings')
        .select('equipment_approval_required')
        .eq('org_id', orgId)
        .maybeSingle();

    final approvalRequired =
        settingsRow?['equipment_approval_required'] as bool? ?? false;

    if (!approvalRequired) {
      return approveEquipmentRequest(
        orgId: orgId,
        requestId: requestModel.id,
        reviewedBy: request.requestedBy,
      );
    }

    return requestModel;
  }

  Future<EquipmentRequest> approveEquipmentRequest({
    required String orgId,
    required String requestId,
    String? reviewedBy,
  }) async {
    final updated = await _client
        .from('equipment_requests')
        .update({
          'status': 'approved',
          'reviewed_by': reviewedBy,
          'reviewed_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('org_id', orgId)
        .eq('id', requestId)
        .select('*')
        .single();

    final request = EquipmentRequest.fromJson(updated);

    await _client.from('equipment_schedule').insert({
      'org_id': orgId,
      'equipment_id': request.equipmentId,
      'crew_id': request.crewId,
      'job_id': request.jobId,
      'start_date': _asYmd(request.startDate),
      'end_date': request.endDate == null ? null : _asYmd(request.endDate!),
      'notes': request.notes,
    });

    return request;
  }

  Future<EquipmentRequest> denyEquipmentRequest({
    required String orgId,
    required String requestId,
    required String reason,
    String? reviewedBy,
  }) async {
    final updated = await _client
        .from('equipment_requests')
        .update({
          'status': 'denied',
          'reviewed_by': reviewedBy,
          'reviewed_at': DateTime.now().toUtc().toIso8601String(),
          'notes': reason.trim(),
        })
        .eq('org_id', orgId)
        .eq('id', requestId)
        .select('*')
        .single();

    return EquipmentRequest.fromJson(updated);
  }

  bool _hasExpiryAlert(Equipment equipment) {
    final registration = getExpiryStatus(equipment.registrationExpiry);
    final insurance = getExpiryStatus(equipment.insuranceExpiry);
    final inspection = getExpiryStatus(equipment.annualInspectionDue);

    return registration != 'ok' || insurance != 'ok' || inspection != 'ok';
  }

  Map<String, dynamic> _equipmentWriteMap({
    required String orgId,
    required EquipmentUpsertRequest request,
  }) {
    return {
      'org_id': orgId,
      'name': request.name.trim(),
      'type': request.type,
      'make': _nullIfBlank(request.make),
      'model': _nullIfBlank(request.model),
      'year': request.year,
      'vin_serial': _nullIfBlank(request.vinSerial),
      'license_plate': _nullIfBlank(request.licensePlate),
      'dot_number': _nullIfBlank(request.dotNumber),
      'registration_expiry':
          request.registrationExpiry == null ? null : _asYmd(request.registrationExpiry!),
      'insurance_expiry':
          request.insuranceExpiry == null ? null : _asYmd(request.insuranceExpiry!),
      'annual_inspection_due': request.annualInspectionDue == null
          ? null
          : _asYmd(request.annualInspectionDue!),
      'is_shareable': request.isShareable,
      'is_active': request.isActive,
      'notes': _nullIfBlank(request.notes),
    };
  }

  String _resolvedEmployeeName(Map<String, dynamic>? employeeRow) {
    if (employeeRow == null) {
      return 'Unknown Driver';
    }

    final displayName = (employeeRow['display_name'] as String?)?.trim();
    if (displayName != null && displayName.isNotEmpty) {
      return displayName;
    }

    final firstName = (employeeRow['first_name'] as String?)?.trim() ?? '';
    final lastName = (employeeRow['last_name'] as String?)?.trim() ?? '';
    final fullName = '$firstName $lastName'.trim();
    if (fullName.isNotEmpty) {
      return fullName;
    }

    return 'Unknown Driver';
  }

  String? _nullIfBlank(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }
    return trimmed;
  }

  DateTime _dateOnly(DateTime value) {
    return DateTime(value.year, value.month, value.day);
  }

  String _asYmd(DateTime value) {
    return value.toIso8601String().split('T').first;
  }

  String _escapeForLike(String value) {
    return value.replaceAll('%', r'\%').replaceAll(',', ' ');
  }
}

@riverpod
EquipmentService equipmentService(Ref ref) {
  return EquipmentService(ref.read(supabaseClientProvider));
}

class MaintenanceService {
  MaintenanceService(this._client);

  final SupabaseClient _client;

  Future<EquipmentMaintenance> logMaintenance({
    required String orgId,
    required String equipmentId,
    required String type,
    required DateTime performedDate,
    int? mileage,
    DateTime? nextServiceDate,
    int? nextServiceMileage,
    String? performedBy,
    double? cost,
    String? notes,
    Uint8List? receiptBytes,
    String? receiptFileName,
    String? existingReceiptUrl,
  }) async {
    String? receiptUrl = existingReceiptUrl;

    if (receiptBytes != null && receiptBytes.isNotEmpty) {
      final fileName = receiptFileName ??
          'receipt-${DateTime.now().millisecondsSinceEpoch}.bin';
      final path = '$orgId/equipment/$equipmentId/maintenance/$fileName';

      await _client.storage.from('fleet-docs').uploadBinary(
            path,
            receiptBytes,
            fileOptions: const FileOptions(upsert: true),
          );
      receiptUrl = _client.storage.from('fleet-docs').getPublicUrl(path);
    }

    final row = await _client
        .from('equipment_maintenance')
        .insert({
          'org_id': orgId,
          'equipment_id': equipmentId,
          'type': type.trim(),
          'performed_date': _asYmd(performedDate),
          'mileage': mileage,
          'next_service_date':
              nextServiceDate == null ? null : _asYmd(nextServiceDate),
          'next_service_mileage': nextServiceMileage,
          'performed_by': _nullIfBlank(performedBy),
          'cost': cost,
          'notes': _nullIfBlank(notes),
          'receipt_url': _nullIfBlank(receiptUrl),
        })
        .select('*')
        .single();

    return EquipmentMaintenance.fromJson(row);
  }

  String _asYmd(DateTime value) {
    return value.toIso8601String().split('T').first;
  }

  String? _nullIfBlank(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }
    return trimmed;
  }
}

@riverpod
MaintenanceService maintenanceService(Ref ref) {
  return MaintenanceService(ref.read(supabaseClientProvider));
}

class DvirService {
  DvirService(this._client);

  final SupabaseClient _client;

  Future<List<Map<String, String>>> listDriverOptions({
    required String orgId,
  }) async {
    final rows = await _client
        .from('employees')
        .select('id,first_name,last_name,display_name,employee_status')
        .eq('org_id', orgId)
        .eq('employee_status', 'active')
        .order('last_name', ascending: true)
        .order('first_name', ascending: true);

    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(
          (row) => {
            'id': row['id'] as String,
            'name': _resolvedEmployeeName(row),
          },
        )
        .toList();
  }

  Future<VehicleInspection> logInspection({
    required String orgId,
    required String equipmentId,
    required String driverId,
    required String inspectionType,
    required DateTime inspectionDate,
    required bool passed,
    int? odometer,
    List<String>? defects,
    String? driverSignature,
    Uint8List? signatureBytes,
    String? signatureFileName,
    String? notes,
  }) async {
    String? signatureUrl = _nullIfBlank(driverSignature);

    if (signatureBytes != null && signatureBytes.isNotEmpty) {
      final fileName = signatureFileName ??
          'signature-${DateTime.now().millisecondsSinceEpoch}.bin';
      final path = '$orgId/equipment/$equipmentId/dvir/$fileName';

      await _client.storage.from('fleet-docs').uploadBinary(
            path,
            signatureBytes,
            fileOptions: const FileOptions(upsert: true),
          );
      signatureUrl = _client.storage.from('fleet-docs').getPublicUrl(path);
    }

    final row = await _client
        .from('vehicle_inspections')
        .insert({
          'org_id': orgId,
          'equipment_id': equipmentId,
          'driver_id': driverId,
          'inspection_type': inspectionType,
          'inspection_date': _asYmd(inspectionDate),
          'odometer': odometer,
          'passed': passed,
          'defects': passed ? null : defects,
          'driver_signature': signatureUrl,
          'notes': _nullIfBlank(notes),
        })
        .select('*')
        .single();

    return VehicleInspection.fromJson(row);
  }

  String _asYmd(DateTime value) {
    return value.toIso8601String().split('T').first;
  }

  String _resolvedEmployeeName(Map<String, dynamic> employeeRow) {
    final displayName = (employeeRow['display_name'] as String?)?.trim();
    if (displayName != null && displayName.isNotEmpty) {
      return displayName;
    }

    final firstName = (employeeRow['first_name'] as String?)?.trim() ?? '';
    final lastName = (employeeRow['last_name'] as String?)?.trim() ?? '';
    final fullName = '$firstName $lastName'.trim();
    if (fullName.isNotEmpty) {
      return fullName;
    }

    return 'Unknown Driver';
  }

  String? _nullIfBlank(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }
    return trimmed;
  }
}

@riverpod
DvirService dvirService(Ref ref) {
  return DvirService(ref.read(supabaseClientProvider));
}
