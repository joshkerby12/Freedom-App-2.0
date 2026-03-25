import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../product_catalog_queries.dart';

class ProductCatalogListScreenMobile extends ConsumerStatefulWidget {
  const ProductCatalogListScreenMobile({super.key});

  @override
  ConsumerState<ProductCatalogListScreenMobile> createState() =>
      _ProductCatalogListScreenMobileState();
}

class _ProductCatalogListScreenMobileState
    extends ConsumerState<ProductCatalogListScreenMobile> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final groupedState = ref.watch(
      productCatalogGroupedListProvider(search: _search, includeInactive: true),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Catalog'),
        actions: [
          IconButton(
            tooltip: 'Material Configurations',
            icon: const Icon(Icons.category_outlined),
            onPressed: () => context.push(AppRoutes.catalogMaterialConfigs),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.catalogProductCreate),
        icon: const Icon(Icons.add),
        label: const Text('Add Product'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search products',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _search = value.trim()),
            ),
          ),
          Expanded(
            child: groupedState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) =>
                  Center(child: Text('Failed to load products: $error')),
              data: (grouped) {
                if (grouped.isEmpty) {
                  return const Center(child: Text('No products yet'));
                }

                final categories = grouped.keys.toList()..sort();

                return ListView.builder(
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final category = categories[index];
                    final products = grouped[category] ?? const [];

                    return ExpansionTile(
                      initiallyExpanded: true,
                      title: Text(_categoryTitle(category)),
                      children: products
                          .map(
                            (product) => ListTile(
                              title: Text(product.name),
                              subtitle: Text(product.pricingMode),
                              trailing: product.isSystemTemplate
                                  ? const Chip(label: Text('System'))
                                  : null,
                              onTap: () => context.push(
                                '${AppRoutes.catalogProducts}/${product.id}',
                              ),
                            ),
                          )
                          .toList(),
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

  String _categoryTitle(String category) {
    switch (category) {
      case 'hardscape':
        return 'Hardscape';
      case 'softscape':
        return 'Softscape';
      case 'drainage':
        return 'Drainage';
      case 'maintenance':
        return 'Maintenance';
      case 'snow':
        return 'Snow';
      case 'irrigation':
        return 'Irrigation';
      default:
        return 'Other';
    }
  }
}
