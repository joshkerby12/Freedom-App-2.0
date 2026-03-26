import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../../orgs/org_notifier.dart';
import '../../crew_detail_provider.dart';
import '../../crew_list_provider.dart';
import '../../crew_service.dart';

class CrewFormScreenMobile extends ConsumerStatefulWidget {
  const CrewFormScreenMobile({super.key, this.crewId});

  final String? crewId;

  bool get isEdit => crewId != null;

  @override
  ConsumerState<CrewFormScreenMobile> createState() =>
      _CrewFormScreenMobileState();
}

class _CrewFormScreenMobileState extends ConsumerState<CrewFormScreenMobile> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _notesController = TextEditingController();

  String? _crewLeadId;
  bool _isActive = true;
  bool _initialized = false;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
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
          child: Text('You do not have permission to manage crews.'),
        ),
      );
    }

    final leadOptionsAsync = ref.watch(crewLeadOptionsProvider);
    final detailAsync = widget.isEdit
        ? ref.watch(crewDetailProvider(widget.crewId!))
        : const AsyncData(null);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit Crew' : 'Add Crew'),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load crew: $error')),
        data: (detail) {
          if (!_initialized) {
            _nameController.text = detail?.crew.name ?? '';
            _notesController.text = detail?.crew.notes ?? '';
            _crewLeadId = detail?.crew.crewLeadId;
            _isActive = detail?.crew.isActive ?? true;
            _initialized = true;
          }

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Crew Name *'),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Crew name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                leadOptionsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, _) => Text('Failed to load crew leads: $error'),
                  data: (options) {
                    return DropdownButtonFormField<String>(
                      value: _crewLeadId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Crew Lead (optional)',
                      ),
                      items: [
                        const DropdownMenuItem<String>(
                          value: null,
                          child: Text('No crew lead'),
                        ),
                        ...options.map(
                          (option) => DropdownMenuItem<String>(
                            value: option['id'],
                            child: Text(option['name'] ?? 'Unknown Employee'),
                          ),
                        ),
                      ],
                      onChanged: (value) => setState(() => _crewLeadId = value),
                    );
                  },
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Active Crew'),
                  value: _isActive,
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
                      : Text(widget.isEdit ? 'Save Changes' : 'Create Crew'),
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

    final router = GoRouter.of(context);
    final messenger = ScaffoldMessenger.of(context);

    setState(() => _submitting = true);

    try {
      final service = ref.read(crewServiceProvider);

      if (widget.isEdit) {
        await service.updateCrew(
          orgId: org.orgId,
          crewId: widget.crewId!,
          name: _nameController.text.trim(),
          crewLeadId: _crewLeadId,
          isActive: _isActive,
          notes: _notesController.text,
        );
      } else {
        final crew = await service.createCrew(
          orgId: org.orgId,
          name: _nameController.text.trim(),
          crewLeadId: _crewLeadId,
          isActive: _isActive,
          notes: _notesController.text,
        );

        if (mounted) {
          ref.invalidate(crewListProvider);
          router.go(AppRoutes.crewDetail.replaceFirst(':id', crew.id));
          return;
        }
      }

      ref.invalidate(crewListProvider);
      if (widget.crewId != null) {
        ref.invalidate(crewDetailProvider(widget.crewId!));
      }

      if (!mounted) {
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text(widget.isEdit ? 'Crew updated' : 'Crew created'),
        ),
      );
      router.pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to save crew: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}
