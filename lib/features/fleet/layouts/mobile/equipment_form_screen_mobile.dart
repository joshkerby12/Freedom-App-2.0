import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../../orgs/org_notifier.dart';
import '../../equipment_detail_provider.dart';
import '../../equipment_list_provider.dart';
import '../../equipment_service.dart';

class EquipmentFormScreenMobile extends ConsumerStatefulWidget {
  const EquipmentFormScreenMobile({super.key, this.equipmentId});

  final String? equipmentId;

  bool get isEdit => equipmentId != null;

  @override
  ConsumerState<EquipmentFormScreenMobile> createState() =>
      _EquipmentFormScreenMobileState();
}

class _EquipmentFormScreenMobileState
    extends ConsumerState<EquipmentFormScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _vinController = TextEditingController();
  final _plateController = TextEditingController();
  final _dotController = TextEditingController();
  final _registrationController = TextEditingController();
  final _insuranceController = TextEditingController();
  final _inspectionController = TextEditingController();
  final _notesController = TextEditingController();

  String _type = 'truck';
  bool _isShareable = false;
  bool _isActive = true;
  bool _initialized = false;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _vinController.dispose();
    _plateController.dispose();
    _dotController.dispose();
    _registrationController.dispose();
    _insuranceController.dispose();
    _inspectionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canManage =
        ref.watch(hasPermissionProvider('fleet.manage')).valueOrNull ?? false;

    if (!canManage) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to manage equipment.'),
        ),
      );
    }

    final detailAsync = widget.isEdit
        ? ref.watch(equipmentDetailProvider(widget.equipmentId!))
        : const AsyncData(null);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit Equipment' : 'Add Equipment'),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load equipment: $error')),
        data: (detail) {
          if (!_initialized) {
            final equipment = detail?.equipment;
            _nameController.text = equipment?.name ?? '';
            _makeController.text = equipment?.make ?? '';
            _modelController.text = equipment?.model ?? '';
            _yearController.text = equipment?.year?.toString() ?? '';
            _vinController.text = equipment?.vinSerial ?? '';
            _plateController.text = equipment?.licensePlate ?? '';
            _dotController.text = equipment?.dotNumber ?? '';
            _registrationController.text = _asYmd(equipment?.registrationExpiry);
            _insuranceController.text = _asYmd(equipment?.insuranceExpiry);
            _inspectionController.text = _asYmd(equipment?.annualInspectionDue);
            _notesController.text = equipment?.notes ?? '';
            _type = equipment?.type ?? _type;
            _isShareable = equipment?.isShareable ?? false;
            _isActive = equipment?.isActive ?? true;
            _initialized = true;
          }

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Name *'),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _type,
                  decoration: const InputDecoration(labelText: 'Type *'),
                  items: const [
                    DropdownMenuItem(value: 'truck', child: Text('Truck')),
                    DropdownMenuItem(
                      value: 'trailer',
                      child: Text('Trailer'),
                    ),
                    DropdownMenuItem(
                      value: 'equipment',
                      child: Text('Equipment'),
                    ),
                    DropdownMenuItem(
                      value: 'attachment',
                      child: Text('Attachment'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() => _type = value);
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _makeController,
                  decoration: const InputDecoration(labelText: 'Make'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _modelController,
                  decoration: const InputDecoration(labelText: 'Model'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _yearController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Year'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _vinController,
                  decoration: const InputDecoration(labelText: 'VIN / Serial'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _plateController,
                  decoration: const InputDecoration(labelText: 'License Plate'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _dotController,
                  decoration: const InputDecoration(labelText: 'DOT Number'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _registrationController,
                  decoration: const InputDecoration(
                    labelText: 'Registration Expiry (YYYY-MM-DD)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _insuranceController,
                  decoration: const InputDecoration(
                    labelText: 'Insurance Expiry (YYYY-MM-DD)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _inspectionController,
                  decoration: const InputDecoration(
                    labelText: 'Annual Inspection Due (YYYY-MM-DD)',
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _isShareable,
                  title: const Text('Shareable Equipment'),
                  onChanged: (value) => setState(() => _isShareable = value),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _isActive,
                  title: const Text('Active'),
                  onChanged: (value) => setState(() => _isActive = value),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _notesController,
                  decoration: const InputDecoration(labelText: 'Notes'),
                  maxLines: 4,
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          widget.isEdit ? 'Save Changes' : 'Create Equipment',
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final org = ref.read(orgProvider).valueOrNull;
    if (org == null) {
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);

    setState(() => _submitting = true);

    try {
      final request = EquipmentUpsertRequest(
        name: _nameController.text,
        type: _type,
        make: _makeController.text,
        model: _modelController.text,
        year: int.tryParse(_yearController.text.trim()),
        vinSerial: _vinController.text,
        licensePlate: _plateController.text,
        dotNumber: _dotController.text,
        registrationExpiry: _parseDate(_registrationController.text),
        insuranceExpiry: _parseDate(_insuranceController.text),
        annualInspectionDue: _parseDate(_inspectionController.text),
        isShareable: _isShareable,
        isActive: _isActive,
        notes: _notesController.text,
      );

      final service = ref.read(equipmentServiceProvider);
      final equipment = widget.isEdit
          ? await service.updateEquipment(
              orgId: org.orgId,
              equipmentId: widget.equipmentId!,
              request: request,
            )
          : await service.createEquipment(orgId: org.orgId, request: request);

      ref.invalidate(equipmentListProvider);
      ref.invalidate(equipmentDetailProvider(equipment.id));

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            widget.isEdit ? 'Equipment updated' : 'Equipment created',
          ),
        ),
      );

      router.go(AppRoutes.equipmentDetail.replaceFirst(':id', equipment.id));
    } catch (error) {
      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(content: Text('Failed to save equipment: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  DateTime? _parseDate(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    return DateTime.tryParse(trimmed);
  }

  String _asYmd(DateTime? value) {
    if (value == null) {
      return '';
    }

    return value.toIso8601String().split('T').first;
  }
}
