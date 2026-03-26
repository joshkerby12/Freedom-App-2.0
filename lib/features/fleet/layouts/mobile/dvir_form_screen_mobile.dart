import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../orgs/org_notifier.dart';
import '../../dvir_driver_provider.dart';
import '../../equipment_detail_provider.dart';
import '../../equipment_service.dart';

class DvirFormScreenMobile extends ConsumerStatefulWidget {
  const DvirFormScreenMobile({
    super.key,
    required this.equipmentId,
    this.inspectionType = 'pre_trip',
  });

  final String equipmentId;
  final String inspectionType;

  @override
  ConsumerState<DvirFormScreenMobile> createState() => _DvirFormScreenMobileState();
}

class _DvirFormScreenMobileState extends ConsumerState<DvirFormScreenMobile> {
  final _formKey = GlobalKey<FormState>();
  final _inspectionDateController = TextEditingController();
  final _odometerController = TextEditingController();
  final _signatureController = TextEditingController();
  final _notesController = TextEditingController();

  static const _defectOptions = <String>[
    'Brakes',
    'Lights/Signals',
    'Tires',
    'Horn',
    'Wipers',
    'Mirrors',
    'Fuel/Fluids',
    'Frame/Body',
    'Coupling Devices',
    'Other',
  ];

  String? _driverId;
  bool _passed = true;
  final Set<String> _selectedDefects = <String>{};
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _inspectionDateController.text =
        DateTime.now().toIso8601String().split('T').first;
  }

  @override
  void dispose() {
    _inspectionDateController.dispose();
    _odometerController.dispose();
    _signatureController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final driversAsync = ref.watch(dvirDriverOptionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.inspectionType == 'post_trip'
              ? 'Post-Trip DVIR'
              : 'Pre-Trip DVIR',
        ),
      ),
      body: driversAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load drivers: $error')),
        data: (drivers) {
          if (drivers.isNotEmpty && _driverId == null) {
            _driverId = drivers.first['id'];
          }

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                DropdownButtonFormField<String>(
                  value: _driverId,
                  decoration: const InputDecoration(labelText: 'Driver *'),
                  items: drivers
                      .map(
                        (driver) => DropdownMenuItem<String>(
                          value: driver['id'],
                          child: Text(driver['name'] ?? 'Unknown Driver'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _driverId = value),
                  validator: (value) {
                    if ((value ?? '').isEmpty) {
                      return 'Driver is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _inspectionDateController,
                  decoration: const InputDecoration(
                    labelText: 'Inspection Date (YYYY-MM-DD) *',
                  ),
                  validator: (value) {
                    if (DateTime.tryParse((value ?? '').trim()) == null) {
                      return 'Enter a valid date';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _odometerController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Odometer'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('All items satisfactory'),
                  value: _passed,
                  onChanged: (value) => setState(() {
                    _passed = value;
                    if (_passed) {
                      _selectedDefects.clear();
                    }
                  }),
                ),
                if (!_passed) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Defects',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ..._defectOptions.map(
                    (defect) => CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(defect),
                      value: _selectedDefects.contains(defect),
                      onChanged: (value) => setState(() {
                        if (value == true) {
                          _selectedDefects.add(defect);
                        } else {
                          _selectedDefects.remove(defect);
                        }
                      }),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                TextFormField(
                  controller: _signatureController,
                  decoration: const InputDecoration(
                    labelText: 'Driver Signature URL (optional)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _notesController,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'Notes'),
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
                      : const Text('Save DVIR'),
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
    if (org == null || _driverId == null) {
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _submitting = true);

    try {
      await ref
          .read(dvirServiceProvider)
          .logInspection(
            orgId: org.orgId,
            equipmentId: widget.equipmentId,
            driverId: _driverId!,
            inspectionType: widget.inspectionType,
            inspectionDate: DateTime.parse(_inspectionDateController.text.trim()),
            passed: _passed,
            odometer: int.tryParse(_odometerController.text.trim()),
            defects: _selectedDefects.toList(),
            driverSignature: _signatureController.text,
            notes: _notesController.text,
          );

      ref.invalidate(equipmentDetailProvider(widget.equipmentId));

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(const SnackBar(content: Text('DVIR saved')));
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to save DVIR: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}
