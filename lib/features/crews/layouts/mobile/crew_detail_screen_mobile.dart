import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../employees/providers/permission_provider.dart';
import '../../crew_detail_provider.dart';

class CrewDetailScreenMobile extends ConsumerWidget {
  const CrewDetailScreenMobile({super.key, required this.crewId});

  final String crewId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canView = ref.watch(hasPermissionProvider('fleet.view')).valueOrNull;
    final canManage =
        ref.watch(hasPermissionProvider('fleet.manage')).valueOrNull ?? false;

    if (canView == false) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have permission to view crew details.'),
        ),
      );
    }

    final crewAsync = ref.watch(crewDetailProvider(crewId));

    return crewAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: const Text('Crew')),
        body: Center(child: Text('Failed to load crew: $error')),
      ),
      data: (detail) {
        if (detail == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Crew')),
            body: const Center(child: Text('Crew not found')),
          );
        }

        final crew = detail.crew;

        return Scaffold(
          appBar: AppBar(
            title: Text(crew.name),
            actions: [
              if (canManage)
                IconButton(
                  tooltip: 'Edit crew',
                  onPressed: () => context.push(
                    AppRoutes.crewEdit.replaceFirst(':id', crew.id),
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
                        crew.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      _StatusBadge(isActive: crew.isActive),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Crew Lead',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(detail.crewLeadName ?? 'No crew lead assigned'),
                    if ((detail.crewLeadRoleName ?? '').isNotEmpty)
                      Text(
                        detail.crewLeadRoleName!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Members',
                child: detail.members.isEmpty
                    ? const Text('No members assigned yet')
                    : Column(
                        children: detail.members
                            .map(
                              (member) => ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  (member.displayName ?? '').trim().isNotEmpty
                                      ? member.displayName!.trim()
                                      : '${member.firstName} ${member.lastName}',
                                ),
                                subtitle: Text(
                                  '${member.employmentType ?? '—'} · ${member.employeeStatus ?? '—'}',
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
                  (crew.notes ?? '').trim().isEmpty
                      ? 'No notes added'
                      : crew.notes!,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            child,
          ],
        ),
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

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        isActive ? 'ACTIVE' : 'INACTIVE',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
