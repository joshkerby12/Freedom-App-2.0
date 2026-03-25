import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../helpers/pricing_helpers.dart';
import '../../item_catalog_list_notifier.dart';
import '../../models/item_catalog_models.dart';

class ItemCatalogListScreenMobile extends ConsumerStatefulWidget {
  const ItemCatalogListScreenMobile({super.key});

  @override
  ConsumerState<ItemCatalogListScreenMobile> createState() =>
      _ItemCatalogListScreenMobileState();
}

class _ItemCatalogListScreenMobileState
    extends ConsumerState<ItemCatalogListScreenMobile> {
  String _search = '';
  bool _needsReviewOnly = false;

  @override
  Widget build(BuildContext context) {
    final itemListState = ref.watch(
      catalogItemListProvider(
        search: _search,
        needsReviewOnly: _needsReviewOnly,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Item Catalog'),
        actions: [
          IconButton(
            tooltip: 'Price Review',
            icon: const Icon(Icons.price_change_outlined),
            onPressed: () => context.push(AppRoutes.catalogPriceReview),
          ),
          IconButton(
            tooltip: 'Suppliers',
            icon: const Icon(Icons.store_outlined),
            onPressed: () => context.push(AppRoutes.catalogSuppliers),
          ),
          IconButton(
            tooltip: 'Partners',
            icon: const Icon(Icons.handshake_outlined),
            onPressed: () => context.push(AppRoutes.catalogPartners),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.catalogItemCreate),
        icon: const Icon(Icons.add),
        label: const Text('Add Item'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search items',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _search = value.trim()),
            ),
          ),
          SwitchListTile(
            title: const Text('Needs Review Only'),
            subtitle: const Text('Show only overdue pricing items'),
            value: _needsReviewOnly,
            onChanged: (value) => setState(() => _needsReviewOnly = value),
          ),
          Expanded(
            child: itemListState.when(
              data: (items) => _ItemList(
                items: items,
                onTapItem: (item) =>
                    context.push('${AppRoutes.catalogItems}/${item.id}'),
              ),
              error: (error, _) =>
                  Center(child: Text('Failed to load catalog items: $error')),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}

class _ItemList extends StatelessWidget {
  const _ItemList({required this.items, required this.onTapItem});

  final List<CatalogItem> items;
  final ValueChanged<CatalogItem> onTapItem;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(child: Text('No catalog items yet'));
    }

    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, _) => const Divider(height: 0),
      itemBuilder: (context, index) {
        final item = items[index];
        final overdueDays = daysPriceReviewOverdue(item);

        return ListTile(
          title: Text(item.name),
          subtitle: Text(
            '${item.unit} · ${item.description ?? 'No description'}',
          ),
          trailing: overdueDays == null
              ? null
              : Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '$overdueDays d overdue',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
          onTap: () => onTapItem(item),
        );
      },
    );
  }
}
