import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../product_catalog_detail_notifier.dart';

class ProductCatalogDetailScreenMobile extends ConsumerWidget {
  const ProductCatalogDetailScreenMobile({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailState = ref.watch(productCatalogDetailProvider(productId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Detail'),
        actions: [
          IconButton(
            tooltip: 'Edit',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () =>
                context.push('${AppRoutes.catalogProducts}/$productId/edit'),
          ),
        ],
      ),
      body: detailState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load product: $error')),
        data: (detail) {
          if (detail == null) {
            return const Center(child: Text('Product not found'));
          }

          final product = detail.product;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      product.name,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  if (product.isSystemTemplate)
                    const Chip(label: Text('System Template')),
                ],
              ),
              const SizedBox(height: 12),
              Text('Category: ${product.category}'),
              Text('Pricing Mode: ${product.pricingMode}'),
              Text(
                'Install Rate: ${product.installRate?.toStringAsFixed(2) ?? '—'}',
              ),
              Text(
                'Minimum Hours: ${product.minimumHours?.toStringAsFixed(2) ?? '—'}',
              ),
              Text('Flat Rate: ${_currency(product.flatRatePrice)}'),
              Text(
                'Labor Rate Override: ${_currency(product.laborRateOverride)}',
              ),
              Text(
                'Equipment Rate Override: ${_currency(product.equipmentRateOverride)}',
              ),
              if ((product.defaultDescription ?? '').isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Description: ${product.defaultDescription}'),
              ],
              const SizedBox(height: 20),
              Text('Inputs', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (detail.inputs.isEmpty)
                const Text('No inputs configured')
              else
                ...detail.inputs.map(
                  (input) => ListTile(
                    dense: true,
                    title: Text(input.label),
                    subtitle: Text(
                      '${input.inputType} · ${input.unitLabel ?? 'no unit'} · '
                      '${input.isRequired ? 'required' : 'optional'}',
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Text(
                'Components',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (detail.components.isEmpty)
                const Text('No components configured')
              else
                ...detail.components.map(
                  (component) => ListTile(
                    dense: true,
                    title: Text(component.label),
                    subtitle: Text(
                      '${component.componentType} · ${component.qtyFormula}',
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
}
