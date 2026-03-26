import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../crew_list_provider.dart';

class CrewListScreenMobile extends ConsumerWidget {
  const CrewListScreenMobile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canView = ref.watch(hasPermissionProvider('fleet.view')).valueOrNull;
    final canManage =
        ref.watch(hasPermissionProvider('fleet.manage')).valueOrNull ?? false;

    if (canView == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view crews.'),
        ),
      );
    }

    final crewsAsync = ref.watch(crewListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Crews')),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.crewNew),
              icon: const Icon(Icons.add),
              label: const Text('Add Crew'),
            )
          : null,
      body: crewsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load crews: $error')),
        data: (crews) {
          if (crews.isEmpty) {
            return _EmptyState(canManage: canManage);
          }

          return ListView.separated(
            itemCount: crews.length,
            separatorBuilder: (_, _) => const Divider(height: 0),
            itemBuilder: (context, index) {
              final summary = crews[index];
              final crew = summary.crew;

              return ListTile(
                title: Text(crew.name),
                subtitle: Text(
                  '${summary.crewLeadName ?? 'No crew lead'} · ${summary.memberCount} members',
                ),
                trailing: _StatusBadge(isActive: crew.isActive),
                onTap: () => context.push(
                  AppRoutes.crewDetail.replaceFirst(':id', crew.id),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.isActive});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? Colors.green : Colors.grey;
    final label = isActive ? 'ACTIVE' : 'INACTIVE';

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
  const _EmptyState({required this.canManage});

  final bool canManage;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.groups_outlined, size: 40),
            const SizedBox(height: 12),
            const Text('No crews yet'),
            const SizedBox(height: 8),
            const Text('Create your first crew to manage field assignments.'),
            if (canManage) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => context.push(AppRoutes.crewNew),
                icon: const Icon(Icons.add),
                label: const Text('Add Crew'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
