import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../orgs/org_notifier.dart';
import '../../equipment_detail_provider.dart';
import '../../equipment_service.dart';

class MaintenanceFormScreenMobile extends ConsumerStatefulWidget {
  const MaintenanceFormScreenMobile({super.key, required this.equipmentId});

  final String equipmentId;

  @override
  ConsumerState<MaintenanceFormScreenMobile> createState() =>
      _MaintenanceFormScreenMobileState();
}

class _MaintenanceFormScreenMobileState
    extends ConsumerState<MaintenanceFormScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _typeController = TextEditingController();
  final _performedDateController = TextEditingController();
  final _mileageController = TextEditingController();
  final _nextServiceDateController = TextEditingController();
  final _nextServiceMileageController = TextEditingController();
  final _performedByController = TextEditingController();
  final _costController = TextEditingController();
  final _notesController = TextEditingController();
  final _receiptUrlController = TextEditingController();

  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _performedDateController.text =
        DateTime.now().toIso8601String().split('T').first;
  }

  @override
  void dispose() {
    _typeController.dispose();
    _performedDateController.dispose();
    _mileageController.dispose();
    _nextServiceDateController.dispose();
    _nextServiceMileageController.dispose();
    _performedByController.dispose();
    _costController.dispose();
    _notesController.dispose();
    _receiptUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Log Maintenance')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _typeController,
              decoration: const InputDecoration(labelText: 'Type *'),
              validator: (value) {
                if ((value ?? '').trim().isEmpty) {
                  return 'Type is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _performedDateController,
              decoration: const InputDecoration(
                labelText: 'Performed Date (YYYY-MM-DD) *',
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
              controller: _mileageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Mileage'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nextServiceDateController,
              decoration: const InputDecoration(
                labelText: 'Next Service Date (YYYY-MM-DD)',
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nextServiceMileageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Next Service Mileage'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _performedByController,
              decoration: const InputDecoration(labelText: 'Performed By'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _costController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Cost'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _receiptUrlController,
              decoration: const InputDecoration(
                labelText: 'Receipt URL (optional)',
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
                  : const Text('Save Maintenance Entry'),
            ),
          ],
        ),
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
    setState(() => _submitting = true);

    try {
      await ref
          .read(maintenanceServiceProvider)
          .logMaintenance(
            orgId: org.orgId,
            equipmentId: widget.equipmentId,
            type: _typeController.text,
            performedDate: DateTime.parse(_performedDateController.text.trim()),
            mileage: int.tryParse(_mileageController.text.trim()),
            nextServiceDate: _parseDate(_nextServiceDateController.text),
            nextServiceMileage: int.tryParse(
              _nextServiceMileageController.text.trim(),
            ),
            performedBy: _performedByController.text,
            cost: double.tryParse(_costController.text.trim()),
            notes: _notesController.text,
            existingReceiptUrl: _receiptUrlController.text,
          );

      ref.invalidate(equipmentDetailProvider(widget.equipmentId));

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        const SnackBar(content: Text('Maintenance entry saved')),
      );
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to save maintenance: $error')),
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
}
