import 'package:flutter/material.dart';

import 'package:freedom_app/features/employees/models/employee_compensation.dart';

class CompensationSectionWidget extends StatelessWidget {
  const CompensationSectionWidget({
    super.key,
    required this.canView,
    required this.history,
  });

  final bool canView;
  final List<EmployeeCompensation> history;

  @override
  Widget build(BuildContext context) {
    if (!canView) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Restricted - you do not have access to compensation details.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      );
    }

    if (history.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No compensation records yet.'),
        ),
      );
    }

    final current = history.first;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Pay', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              '${current.payType.toUpperCase()} • \$${current.payRate.toStringAsFixed(2)}',
            ),
            Text('Effective ${current.effectiveDate}'),
            const SizedBox(height: 16),
            Text('History', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            ...history.map(
              (row) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(
                  '${row.payType.toUpperCase()} • \$${row.payRate.toStringAsFixed(2)}',
                ),
                subtitle: Text(row.effectiveDate),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
