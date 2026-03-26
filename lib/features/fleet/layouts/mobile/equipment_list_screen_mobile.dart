import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../equipment_list_provider.dart';
import '../../equipment_service.dart';
import '../../models/fleet_models.dart';

class EquipmentListScreenMobile extends ConsumerStatefulWidget {
  const EquipmentListScreenMobile({super.key});

  @override
  ConsumerState<EquipmentListScreenMobile> createState() =>
      _EquipmentListScreenMobileState();
}

class _EquipmentListScreenMobileState
    extends ConsumerState<EquipmentListScreenMobile> {
  String _search = '';
  String _type = 'all';
  bool _alertOnly = false;
  bool _inactiveOnly = false;

  @override
  Widget build(BuildContext context) {
    final canView =
        ref.watch(hasPermissionProvider('equipment.view')).valueOrNull;
    final canManage =
        ref.watch(hasPermissionProvider('fleet.manage')).valueOrNull ?? false;

    if (canView == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view equipment.'),
        ),
      );
    }

    final equipmentAsync = ref.watch(
      equipmentListProvider(
        search: _search,
        type: _type,
        hasExpiryAlert: _alertOnly,
        inactiveOnly: _inactiveOnly,
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Equipment')),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.equipmentNew),
              icon: const Icon(Icons.add),
              label: const Text('Add Equipment'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search name, make, model, VIN, or plate',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _search = value.trim()),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _TypeChip(
                  label: 'All',
                  selected: _type == 'all',
                  onTap: () => setState(() => _type = 'all'),
                ),
                _TypeChip(
                  label: 'Trucks',
                  selected: _type == 'truck',
                  onTap: () => setState(() => _type = 'truck'),
                ),
                _TypeChip(
                  label: 'Trailers',
                  selected: _type == 'trailer',
                  onTap: () => setState(() => _type = 'trailer'),
                ),
                _TypeChip(
                  label: 'Equipment',
                  selected: _type == 'equipment',
                  onTap: () => setState(() => _type = 'equipment'),
                ),
                _TypeChip(
                  label: 'Attachments',
                  selected: _type == 'attachment',
                  onTap: () => setState(() => _type = 'attachment'),
                ),
                _TypeChip(
                  label: 'Has Expiry Alert',
                  selected: _alertOnly,
                  onTap: () => setState(() => _alertOnly = !_alertOnly),
                ),
                _TypeChip(
                  label: 'Inactive',
                  selected: _inactiveOnly,
                  onTap: () => setState(() => _inactiveOnly = !_inactiveOnly),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: equipmentAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) =>
                  Center(child: Text('Failed to load equipment: $error')),
              data: (equipment) {
                if (equipment.isEmpty) {
                  return const _EmptyState();
                }

                return ListView.separated(
                  itemCount: equipment.length,
                  separatorBuilder: (_, _) => const Divider(height: 0),
                  itemBuilder: (context, index) {
                    final item = equipment[index];
                    final subtitle = [
                      _titleCase(item.type),
                      if ((item.make ?? '').isNotEmpty) item.make!,
                      if ((item.model ?? '').isNotEmpty) item.model!,
                      if (item.year != null) item.year.toString(),
                    ].join(' · ');

                    final status = _worstExpiryStatus(ref, item);

                    return ListTile(
                      title: Text(item.name),
                      subtitle: Text(
                        '$subtitle\n${item.isActive ? 'Active' : 'Inactive'}',
                      ),
                      isThreeLine: true,
                      trailing: status == 'ok'
                          ? null
                          : _ExpiryBadge(status: status),
                      onTap: () => context.push(
                        AppRoutes.equipmentDetail.replaceFirst(':id', item.id),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _worstExpiryStatus(WidgetRef ref, Equipment item) {
    final service = ref.read(equipmentServiceProvider);

    final statuses = [
      service.getExpiryStatus(item.registrationExpiry),
      service.getExpiryStatus(item.insuranceExpiry),
      service.getExpiryStatus(item.annualInspectionDue),
    ];

    if (statuses.contains('expired')) {
      return 'expired';
    }
    if (statuses.contains('critical')) {
      return 'critical';
    }
    if (statuses.contains('warning')) {
      return 'warning';
    }
    return 'ok';
  }

  String _titleCase(String value) {
    if (value.isEmpty) {
      return value;
    }

    return '${value[0].toUpperCase()}${value.substring(1)}';
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _ExpiryBadge extends StatelessWidget {
  const _ExpiryBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    late final Color color;
    late final String label;

    switch (status) {
      case 'expired':
        color = Colors.red;
        label = 'EXPIRED';
        break;
      case 'critical':
        color = Colors.red;
        label = 'Expires Soon';
        break;
      default:
        color = Colors.orange;
        label = 'Expiring Soon';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.precision_manufacturing_outlined, size: 40),
          SizedBox(height: 12),
          Text('No equipment found'),
        ],
      ),
    );
  }
}
