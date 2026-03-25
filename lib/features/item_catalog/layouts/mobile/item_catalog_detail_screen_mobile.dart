import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../item_catalog_detail_notifier.dart';

class ItemCatalogDetailScreenMobile extends ConsumerWidget {
  const ItemCatalogDetailScreenMobile({super.key, required this.itemId});

  final String itemId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailState = ref.watch(catalogItemDetailProvider(itemId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Item Detail'),
        actions: [
          IconButton(
            tooltip: 'Edit',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () =>
                context.push('${AppRoutes.catalogItems}/$itemId/edit'),
          ),
        ],
      ),
      body: detailState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load item: $error')),
        data: (detail) {
          if (detail == null) {
            return const Center(child: Text('Item not found'));
          }

          final item = detail.item;
          final spec = detail.spec;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(item.name, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text(item.description ?? 'No description'),
              const SizedBox(height: 16),
              _InfoTile(label: 'Unit', value: item.unit),
              _InfoTile(
                label: 'Default Cost',
                value: _currency(item.defaultCost),
              ),
              _InfoTile(
                label: 'Default Sell Price',
                value: _currency(item.defaultSellPrice),
              ),
              _InfoTile(
                label: 'Resolved Unit Price',
                value: _currency(detail.resolvedUnitPrice),
              ),
              _InfoTile(
                label: 'Markup %',
                value: _percent(item.defaultMarkupPct),
              ),
              _InfoTile(label: 'Waste %', value: _percent(item.wastePct)),
              _InfoTile(
                label: 'Price Review Status',
                value: detail.needsPriceReview
                    ? 'Overdue (${detail.daysOverdue ?? 0} days)'
                    : 'Current',
              ),
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: detail.needsPriceReview
                    ? () async {
                        await ref
                            .read(catalogItemDetailProvider(itemId).notifier)
                            .markReviewed();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Item marked as reviewed'),
                            ),
                          );
                        }
                      }
                    : null,
                child: const Text('Mark Reviewed'),
              ),
              const SizedBox(height: 20),
              Text('Specs', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (spec == null)
                const Text('No specs configured')
              else ...[
                _InfoTile(label: 'Length (in)', value: _decimal(spec.lengthIn)),
                _InfoTile(label: 'Width (in)', value: _decimal(spec.widthIn)),
                _InfoTile(
                  label: 'Height/Depth (in)',
                  value: _decimal(spec.heightDepthIn),
                ),
                _InfoTile(
                  label: 'Spread Rate (sqft/in)',
                  value: _decimal(spec.spreadRateSqftPerInch),
                ),
                _InfoTile(label: 'Face Feet', value: _decimal(spec.faceFeet)),
                if (spec.extraSpecs != null && spec.extraSpecs!.isNotEmpty)
                  Text('Extra Specs: ${spec.extraSpecs}'),
              ],
              const SizedBox(height: 20),
              Text(
                'Supplier Pricing',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (detail.suppliers.isEmpty)
                const Text('No suppliers linked')
              else
                ...detail.suppliers.map(
                  (supplierLink) => Card(
                    child: ListTile(
                      title: Text(supplierLink.supplier?.name ?? 'Supplier'),
                      subtitle: Text(
                        '${supplierLink.supplierLocation?.name ?? 'No location'} · ${_currency(supplierLink.unitCost)}',
                      ),
                      trailing: supplierLink.isPreferred
                          ? const Chip(label: Text('Preferred'))
                          : null,
                      onTap: supplierLink.supplierId.isEmpty
                          ? null
                          : () => context.push(
                              '${AppRoutes.catalogSuppliers}/${supplierLink.supplierId}',
                            ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  String _currency(double? value) {
    if (value == null) {
      return '—';
    }
    return '\$${value.toStringAsFixed(2)}';
  }

  String _percent(double? value) {
    if (value == null) {
      return '—';
    }
    return '${value.toStringAsFixed(2)}%';
  }

  String _decimal(double? value) {
    if (value == null) {
      return '—';
    }
    return value.toStringAsFixed(2);
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 170,
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
