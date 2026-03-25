import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../item_catalog_queries.dart';

class SupplierListScreenMobile extends ConsumerStatefulWidget {
  const SupplierListScreenMobile({super.key});

  @override
  ConsumerState<SupplierListScreenMobile> createState() =>
      _SupplierListScreenMobileState();
}

class _SupplierListScreenMobileState
    extends ConsumerState<SupplierListScreenMobile> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final suppliersState = ref.watch(supplierListProvider(search: _search));

    return Scaffold(
      appBar: AppBar(title: const Text('Suppliers')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.catalogSupplierCreate),
        icon: const Icon(Icons.add),
        label: const Text('Add Supplier'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search suppliers',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _search = value.trim()),
            ),
          ),
          Expanded(
            child: suppliersState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) =>
                  Center(child: Text('Failed to load suppliers: $error')),
              data: (suppliers) {
                if (suppliers.isEmpty) {
                  return const Center(child: Text('No suppliers yet'));
                }

                return ListView.separated(
                  itemCount: suppliers.length,
                  separatorBuilder: (_, _) => const Divider(height: 0),
                  itemBuilder: (context, index) {
                    final supplier = suppliers[index];
                    return ListTile(
                      title: Text(supplier.name),
                      subtitle: Text(supplier.contactName ?? 'No contact'),
                      trailing: supplier.isActive
                          ? null
                          : const Chip(label: Text('Inactive')),
                      onTap: () => context.push(
                        '${AppRoutes.catalogSuppliers}/${supplier.id}',
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
}
