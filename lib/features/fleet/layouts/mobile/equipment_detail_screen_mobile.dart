import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../equipment_detail_provider.dart';
import '../../equipment_service.dart';
import '../../models/fleet_models.dart';

class EquipmentDetailScreenMobile extends ConsumerWidget {
  const EquipmentDetailScreenMobile({super.key, required this.equipmentId});

  final String equipmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canView =
        ref.watch(hasPermissionProvider('equipment.view')).valueOrNull;
    final canManage =
        ref.watch(hasPermissionProvider('fleet.manage')).valueOrNull ?? false;

    if (canView == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view this equipment.'),
        ),
      );
    }

    final detailAsync = ref.watch(equipmentDetailProvider(equipmentId));

    return detailAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Equipment')),
        body: Center(child: Text('Failed to load equipment: $error')),
      ),
      data: (detail) {
        if (detail == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Equipment')),
            body: const Center(child: Text('Equipment not found')),
          );
        }

        final equipment = detail.equipment;

        return Scaffold(
          appBar: AppBar(
            title: Text(equipment.name),
            actions: [
              if (canManage)
                IconButton(
                  tooltip: 'Edit equipment',
                  onPressed: () => context.push(
                    AppRoutes.equipmentEdit.replaceFirst(':id', equipment.id),
                  ),
                  icon: const Icon(Icons.edit),
                ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        equipment.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_titleCase(equipment.type)} · ${equipment.isActive ? 'Active' : 'Inactive'}',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Identification',
                child: Column(
                  children: [
                    _DataRow(label: 'Make', value: equipment.make),
                    _DataRow(label: 'Model', value: equipment.model),
                    _DataRow(
                      label: 'Year',
                      value: equipment.year?.toString(),
                    ),
                    _DataRow(label: 'VIN / Serial', value: equipment.vinSerial),
                    _DataRow(
                      label: 'License Plate',
                      value: equipment.licensePlate,
                    ),
                    _DataRow(label: 'DOT Number', value: equipment.dotNumber),
                    _DataRow(
                      label: 'Shareable',
                      value: equipment.isShareable ? 'Yes' : 'No',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Compliance & Expiry',
                child: Column(
                  children: [
                    _ExpiryRow(
                      label: 'Registration',
                      date: equipment.registrationExpiry,
                    ),
                    _ExpiryRow(
                      label: 'Insurance',
                      date: equipment.insuranceExpiry,
                    ),
                    _ExpiryRow(
                      label: 'Annual Inspection',
                      date: equipment.annualInspectionDue,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Current Assignment',
                child: detail.currentAssignment == null
                    ? const Text('No current assignment')
                    : _DataRow(
                        label: detail.currentAssignment!.crewName ?? 'Crew',
                        value:
                            _formatDate(detail.currentAssignment!.assignedDate),
                      ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Upcoming Schedule',
                child: detail.schedule.isEmpty
                    ? const Text('No upcoming schedule')
                    : Column(
                        children: detail.schedule
                            .map(
                              (entry) => _DataRow(
                                label: entry.crewName ?? 'Crew',
                                value: _rangeLabel(
                                  startDate: entry.startDate,
                                  endDate: entry.endDate,
                                ),
                              ),
                            )
                            .toList(),
                      ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Maintenance Log',
                action: FilledButton.tonal(
                  onPressed: () => context.push(
                    AppRoutes.equipmentMaintenanceNew.replaceFirst(
                      ':id',
                      equipment.id,
                    ),
                  ),
                  child: const Text('Log Maintenance'),
                ),
                child: detail.maintenance.isEmpty
                    ? const Text('No maintenance records')
                    : Column(
                        children: detail.maintenance
                            .map(
                              (entry) => ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(entry.type),
                                subtitle: Text(
                                  '${_formatDate(entry.performedDate)} · ${entry.performedBy ?? 'Unknown'}',
                                ),
                                trailing: entry.cost == null
                                    ? null
                                    : Text('\$${entry.cost!.toStringAsFixed(2)}'),
                              ),
                            )
                            .toList(),
                      ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'DVIR History',
                action: FilledButton.tonal(
                  onPressed: () => context.push(
                    AppRoutes.equipmentDvirNew.replaceFirst(':id', equipment.id),
                  ),
                  child: const Text('New DVIR'),
                ),
                child: detail.inspections.isEmpty
                    ? const Text('No DVIR history')
                    : Column(
                        children: detail.inspections
                            .map(
                              (entry) => ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  '${entry.inspectionType == 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'} · ${entry.passed ? 'Passed' : 'Failed'}',
                                ),
                                subtitle: Text(
                                  '${_formatDate(entry.inspectionDate)} · ${entry.driverName ?? 'Unknown Driver'}',
                                ),
                                trailing: entry.passed
                                    ? null
                                    : Text(
                                        '${entry.defects?.length ?? 0} defects',
                                      ),
                              ),
                            )
                            .toList(),
                      ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Notes',
                child: Text(
                  (equipment.notes ?? '').trim().isEmpty
                      ? 'No notes added'
                      : equipment.notes!,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _titleCase(String value) {
    if (value.isEmpty) {
      return value;
    }

    return '${value[0].toUpperCase()}${value.substring(1)}';
  }

  String _rangeLabel({required DateTime startDate, DateTime? endDate}) {
    if (endDate == null) {
      return _formatDate(startDate);
    }

    return '${_formatDate(startDate)} to ${_formatDate(endDate)}';
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
    this.action,
  });

  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (action != null) action!,
              ],
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}

class _DataRow extends StatelessWidget {
  const _DataRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(child: Text((value ?? '').trim().isEmpty ? '—' : value!)),
        ],
      ),
    );
  }
}

class _ExpiryRow extends ConsumerWidget {
  const _ExpiryRow({required this.label, required this.date});

  final String label;
  final DateTime? date;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.read(equipmentServiceProvider).getExpiryStatus(date);

    String? badgeLabel;
    Color? badgeColor;

    if (status == 'warning') {
      badgeLabel = 'Expiring Soon';
      badgeColor = Colors.orange;
    } else if (status == 'critical') {
      badgeLabel = 'Expires Soon';
      badgeColor = Colors.red;
    } else if (status == 'expired') {
      badgeLabel = 'EXPIRED';
      badgeColor = Colors.red;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '$label: ${date == null ? '—' : '${date.month}/${date.day}/${date.year}'}',
            ),
          ),
          if (badgeLabel != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: badgeColor!.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                badgeLabel,
                style: TextStyle(
                  color: badgeColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
