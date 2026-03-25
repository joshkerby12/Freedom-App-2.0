import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../orgs/org_notifier.dart';
import '../../helpers/pricing_helpers.dart';
import '../../item_catalog_list_notifier.dart';
import '../../item_catalog_queries.dart';
import '../../item_catalog_service.dart';

class PriceReviewScreenMobile extends ConsumerStatefulWidget {
  const PriceReviewScreenMobile({super.key});

  @override
  ConsumerState<PriceReviewScreenMobile> createState() =>
      _PriceReviewScreenMobileState();
}

class _PriceReviewScreenMobileState
    extends ConsumerState<PriceReviewScreenMobile> {
  bool _isMarkingAll = false;

  @override
  Widget build(BuildContext context) {
    final reviewState = ref.watch(priceReviewItemsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Price Review')),
      body: reviewState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load review items: $error')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('No overdue price reviews'));
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.tonalIcon(
                    onPressed: _isMarkingAll ? null : _markAllReviewed,
                    icon: _isMarkingAll
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.done_all),
                    label: const Text('Mark All Reviewed'),
                  ),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(height: 0),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final overdueDays = daysPriceReviewOverdue(item) ?? 0;
                    final currentCost = item.defaultCost;

                    return ListTile(
                      title: Text(item.name),
                      subtitle: Text(
                        'Current: ${_currency(currentCost)} · Last reviewed: '
                        '${item.lastPriceUpdatedAt?.toIso8601String().split('T').first ?? 'Never'}',
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('$overdueDays d overdue'),
                          TextButton(
                            onPressed: () => _reviewSingle(item.id),
                            child: const Text('Mark reviewed'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _reviewSingle(String itemId) async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    await ref
        .read(catalogItemServiceProvider)
        .markReviewed(orgId: orgId, itemId: itemId);

    ref.invalidate(priceReviewItemsProvider);
    ref.invalidate(catalogItemListProvider);

    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Item marked reviewed')));
    }
  }

  Future<void> _markAllReviewed() async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    setState(() => _isMarkingAll = true);
    try {
      await ref.read(catalogItemServiceProvider).markAllReviewed(orgId: orgId);
      ref.invalidate(priceReviewItemsProvider);
      ref.invalidate(catalogItemListProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All overdue items marked reviewed')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isMarkingAll = false);
      }
    }
  }

  String _currency(double? value) {
    if (value == null) {
      return '—';
    }
    return '\$${value.toStringAsFixed(2)}';
  }
}
