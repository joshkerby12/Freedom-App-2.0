import '../models/item_catalog_models.dart';

class ResolvedItemPrice {
  const ResolvedItemPrice({required this.unitPrice, required this.source});

  final double unitPrice;
  final String source;
}

ResolvedItemPrice resolveItemPrice({
  required CatalogItem item,
  double? preferredSupplierUnitCost,
  double? orgMarkupPct,
}) {
  if (item.defaultSellPrice != null) {
    return ResolvedItemPrice(
      unitPrice: item.defaultSellPrice!,
      source: 'default_sell_price',
    );
  }

  final markupPct = item.defaultMarkupPct ?? orgMarkupPct ?? 0;
  final multiplier = 1 + (markupPct / 100);

  if (preferredSupplierUnitCost != null) {
    return ResolvedItemPrice(
      unitPrice: preferredSupplierUnitCost * multiplier,
      source: 'preferred_supplier_cost_plus_markup',
    );
  }

  if (item.defaultCost != null) {
    return ResolvedItemPrice(
      unitPrice: item.defaultCost! * multiplier,
      source: 'default_cost_plus_markup',
    );
  }

  return const ResolvedItemPrice(unitPrice: 0, source: 'no_price_source');
}

bool isPriceReviewOverdue(CatalogItem item, {DateTime? today}) {
  final lastReviewed = item.lastPriceUpdatedAt;
  final frequencyDays = item.priceReviewFrequencyDays;

  if (lastReviewed == null || frequencyDays == null || frequencyDays <= 0) {
    return false;
  }

  final now = (today ?? DateTime.now()).toUtc();
  final dueDate = lastReviewed.toUtc().add(Duration(days: frequencyDays));
  return now.isAfter(dueDate);
}

int? daysPriceReviewOverdue(CatalogItem item, {DateTime? today}) {
  if (!isPriceReviewOverdue(item, today: today)) {
    return null;
  }

  final lastReviewed = item.lastPriceUpdatedAt;
  final frequencyDays = item.priceReviewFrequencyDays;
  if (lastReviewed == null || frequencyDays == null) {
    return null;
  }

  final dueDate = lastReviewed.toUtc().add(Duration(days: frequencyDays));
  final now = (today ?? DateTime.now()).toUtc();
  return now.difference(dueDate).inDays;
}
