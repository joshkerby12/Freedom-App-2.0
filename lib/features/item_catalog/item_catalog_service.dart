import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'helpers/pricing_helpers.dart';
import 'models/item_catalog_models.dart';

part 'item_catalog_service.g.dart';

class CatalogItemSpecUpsert {
  const CatalogItemSpecUpsert({
    this.lengthIn,
    this.widthIn,
    this.heightDepthIn,
    this.spreadRateSqftPerInch,
    this.faceFeet,
    this.extraSpecs,
  });

  final double? lengthIn;
  final double? widthIn;
  final double? heightDepthIn;
  final double? spreadRateSqftPerInch;
  final double? faceFeet;
  final Map<String, dynamic>? extraSpecs;
}

class CatalogItemSupplierUpsert {
  const CatalogItemSupplierUpsert({
    required this.supplierId,
    this.supplierLocationId,
    this.isPreferred = false,
    this.supplierSku,
    this.supplierItemName,
    this.unitCost,
    this.lastPriceDate,
  });

  final String supplierId;
  final String? supplierLocationId;
  final bool isPreferred;
  final String? supplierSku;
  final String? supplierItemName;
  final double? unitCost;
  final DateTime? lastPriceDate;
}

class CatalogItemUpsertRequest {
  const CatalogItemUpsertRequest({
    required this.name,
    required this.unit,
    this.description,
    this.defaultCost,
    this.defaultSellPrice,
    this.defaultMarkupPct,
    this.wastePct = 0,
    this.lastPriceUpdatedAt,
    this.priceReviewFrequencyDays,
    this.priceAutoIncreasePct,
    this.priceAutoIncreaseMonths,
    this.priceNextIncreaseDate,
    this.color,
    this.quantityType = 'decimal',
    this.roundTo,
    this.minimumQty,
    this.packageUnit,
    this.isActive = true,
    this.sortOrder = 0,
    this.spec,
    this.suppliers = const [],
  });

  final String name;
  final String unit;
  final String? description;
  final double? defaultCost;
  final double? defaultSellPrice;
  final double? defaultMarkupPct;
  final double wastePct;
  final DateTime? lastPriceUpdatedAt;
  final int? priceReviewFrequencyDays;
  final double? priceAutoIncreasePct;
  final int? priceAutoIncreaseMonths;
  final DateTime? priceNextIncreaseDate;
  final String? color;
  final String quantityType;
  final double? roundTo;
  final double? minimumQty;
  final String? packageUnit;
  final bool isActive;
  final int sortOrder;
  final CatalogItemSpecUpsert? spec;
  final List<CatalogItemSupplierUpsert> suppliers;
}

class CatalogItemService {
  CatalogItemService(this._client);

  final SupabaseClient _client;

  Future<List<CatalogItem>> listItems({
    required String orgId,
    String search = '',
    int limit = 50,
    int offset = 0,
    bool needsReviewOnly = false,
  }) async {
    dynamic query = _client.from('catalog_items').select().eq('org_id', orgId);

    if (search.trim().isNotEmpty) {
      query = query.ilike('name', '%${search.trim()}%');
    }

    query = query.order('name').range(offset, offset + limit - 1);

    final response = await query;
    final rows = (response as List).cast<Map<String, dynamic>>();

    final items = rows.map(CatalogItem.fromJson).toList();
    if (!needsReviewOnly) {
      return items;
    }

    return items.where(isPriceReviewOverdue).toList();
  }

  Future<CatalogItemDetail?> getItemDetail({
    required String orgId,
    required String itemId,
  }) async {
    final itemRow = await _client
        .from('catalog_items')
        .select()
        .eq('org_id', orgId)
        .eq('id', itemId)
        .maybeSingle();

    if (itemRow == null) {
      return null;
    }

    final item = CatalogItem.fromJson(itemRow);

    final specRow = await _client
        .from('catalog_item_specs')
        .select()
        .eq('org_id', orgId)
        .eq('catalog_item_id', itemId)
        .maybeSingle();

    final supplierRows = await _client
        .from('catalog_item_suppliers')
        .select()
        .eq('org_id', orgId)
        .eq('catalog_item_id', itemId)
        .order('is_preferred', ascending: false);

    final supplierList = (supplierRows as List).cast<Map<String, dynamic>>();
    final supplierIds = supplierList
        .map((row) => row['supplier_id'] as String?)
        .whereType<String>()
        .toSet()
        .toList();

    final locationIds = supplierList
        .map((row) => row['supplier_location_id'] as String?)
        .whereType<String>()
        .toSet()
        .toList();

    final supplierById = await _loadSuppliersById(orgId, supplierIds);
    final locationById = await _loadLocationsById(orgId, locationIds);

    final suppliers = supplierList
        .map(
          (row) => CatalogItemSupplier.fromJson({
            ...row,
            'supplier': supplierById[row['supplier_id']],
            'supplier_location': locationById[row['supplier_location_id']],
          }),
        )
        .toList();

    final preferredUnitCost = suppliers
        .where((supplier) => supplier.isPreferred)
        .map((supplier) => supplier.unitCost)
        .whereType<double>()
        .cast<double?>()
        .firstOrNull;

    final orgMarkupPct = await _loadOrgMaterialMarkup(orgId);
    final resolvedPrice = resolveItemPrice(
      item: item,
      preferredSupplierUnitCost: preferredUnitCost,
      orgMarkupPct: orgMarkupPct,
    );

    return CatalogItemDetail(
      item: item,
      spec: specRow == null ? null : CatalogItemSpec.fromJson(specRow),
      suppliers: suppliers,
      resolvedUnitPrice: resolvedPrice.unitPrice,
      needsPriceReview: isPriceReviewOverdue(item),
      daysOverdue: daysPriceReviewOverdue(item),
    );
  }

  Future<CatalogItem> createItem({
    required String orgId,
    required CatalogItemUpsertRequest request,
  }) async {
    _assertPreferredSupplierConstraint(request.suppliers);

    final row = await _client
        .from('catalog_items')
        .insert(_itemWriteMap(orgId: orgId, request: request))
        .select()
        .single();

    final item = CatalogItem.fromJson(row);

    await _upsertSpec(orgId: orgId, itemId: item.id, spec: request.spec);
    await _replaceSuppliers(
      orgId: orgId,
      itemId: item.id,
      suppliers: request.suppliers,
    );

    return item;
  }

  Future<CatalogItem> updateItem({
    required String orgId,
    required String itemId,
    required CatalogItemUpsertRequest request,
  }) async {
    _assertPreferredSupplierConstraint(request.suppliers);

    final row = await _client
        .from('catalog_items')
        .update(_itemWriteMap(orgId: orgId, request: request))
        .eq('org_id', orgId)
        .eq('id', itemId)
        .select()
        .single();

    final item = CatalogItem.fromJson(row);

    await _upsertSpec(orgId: orgId, itemId: item.id, spec: request.spec);
    await _replaceSuppliers(
      orgId: orgId,
      itemId: item.id,
      suppliers: request.suppliers,
    );

    return item;
  }

  Future<void> deleteItem({required String orgId, required String itemId}) {
    return _client
        .from('catalog_items')
        .delete()
        .eq('org_id', orgId)
        .eq('id', itemId);
  }

  Future<List<CatalogItem>> getOverdueItems({required String orgId}) async {
    final items = await listItems(orgId: orgId, limit: 1000);
    final overdue = items.where(isPriceReviewOverdue).toList()
      ..sort((a, b) {
        final aDays = daysPriceReviewOverdue(a) ?? 0;
        final bDays = daysPriceReviewOverdue(b) ?? 0;
        return bDays.compareTo(aDays);
      });

    return overdue;
  }

  Future<void> markReviewed({required String orgId, required String itemId}) {
    return _client
        .from('catalog_items')
        .update({
          'last_price_updated_at': DateTime.now()
              .toUtc()
              .toIso8601String()
              .split('T')
              .first,
        })
        .eq('org_id', orgId)
        .eq('id', itemId);
  }

  Future<void> markAllReviewed({required String orgId}) async {
    final overdueItems = await getOverdueItems(orgId: orgId);
    for (final item in overdueItems) {
      await markReviewed(orgId: orgId, itemId: item.id);
    }
  }

  Future<int> applyScheduledAutoIncreases({required String orgId}) async {
    final now = DateTime.now().toUtc();
    final today = now.toIso8601String().split('T').first;

    final rows = await _client
        .from('catalog_items')
        .select()
        .eq('org_id', orgId)
        .lte('price_next_increase_date', today)
        .not('default_cost', 'is', null)
        .not('price_auto_increase_pct', 'is', null)
        .not('price_auto_increase_months', 'is', null);

    final items = (rows as List)
        .cast<Map<String, dynamic>>()
        .map(CatalogItem.fromJson)
        .toList();

    var updatedCount = 0;
    for (final item in items) {
      final pct = item.priceAutoIncreasePct;
      final months = item.priceAutoIncreaseMonths;
      final defaultCost = item.defaultCost;

      if (pct == null || months == null || defaultCost == null) {
        continue;
      }

      final nextDateBase = item.priceNextIncreaseDate ?? now;
      final nextIncreaseDate = _addMonths(nextDateBase, months);
      final newCost = defaultCost * (1 + (pct / 100));

      await _client
          .from('catalog_items')
          .update({
            'default_cost': newCost,
            'price_next_increase_date': nextIncreaseDate
                .toUtc()
                .toIso8601String()
                .split('T')
                .first,
          })
          .eq('org_id', orgId)
          .eq('id', item.id);

      updatedCount++;
    }

    return updatedCount;
  }

  Future<double?> _loadOrgMaterialMarkup(String orgId) async {
    final row = await _client
        .from('org_settings')
        .select('material_markup_pct')
        .eq('org_id', orgId)
        .maybeSingle();

    if (row == null) {
      return null;
    }

    final value = row['material_markup_pct'];
    if (value is num) {
      return value.toDouble();
    }
    return null;
  }

  Future<void> _upsertSpec({
    required String orgId,
    required String itemId,
    CatalogItemSpecUpsert? spec,
  }) async {
    if (spec == null) {
      await _client
          .from('catalog_item_specs')
          .delete()
          .eq('org_id', orgId)
          .eq('catalog_item_id', itemId);
      return;
    }

    await _client.from('catalog_item_specs').upsert({
      'org_id': orgId,
      'catalog_item_id': itemId,
      'length_in': spec.lengthIn,
      'width_in': spec.widthIn,
      'height_depth_in': spec.heightDepthIn,
      'spread_rate_sqft_per_inch': spec.spreadRateSqftPerInch,
      'face_feet': spec.faceFeet,
      'extra_specs': spec.extraSpecs,
    }, onConflict: 'catalog_item_id');
  }

  Future<void> _replaceSuppliers({
    required String orgId,
    required String itemId,
    required List<CatalogItemSupplierUpsert> suppliers,
  }) async {
    await _client
        .from('catalog_item_suppliers')
        .delete()
        .eq('org_id', orgId)
        .eq('catalog_item_id', itemId);

    if (suppliers.isEmpty) {
      return;
    }

    final rows = suppliers
        .map(
          (supplier) => {
            'org_id': orgId,
            'catalog_item_id': itemId,
            'supplier_id': supplier.supplierId,
            'supplier_location_id': supplier.supplierLocationId,
            'is_preferred': supplier.isPreferred,
            'supplier_sku': supplier.supplierSku,
            'supplier_item_name': supplier.supplierItemName,
            'unit_cost': supplier.unitCost,
            'last_price_date': supplier.lastPriceDate
                ?.toUtc()
                .toIso8601String()
                .split('T')
                .first,
          },
        )
        .toList();

    await _client.from('catalog_item_suppliers').insert(rows);
  }

  Future<Map<String, Supplier>> _loadSuppliersById(
    String orgId,
    List<String> supplierIds,
  ) async {
    if (supplierIds.isEmpty) {
      return const {};
    }

    final rows = await _client
        .from('suppliers')
        .select()
        .eq('org_id', orgId)
        .inFilter('id', supplierIds);

    final suppliers = (rows as List)
        .cast<Map<String, dynamic>>()
        .map(Supplier.fromJson)
        .toList();

    return {for (final supplier in suppliers) supplier.id: supplier};
  }

  Future<Map<String, SupplierLocation>> _loadLocationsById(
    String orgId,
    List<String> locationIds,
  ) async {
    if (locationIds.isEmpty) {
      return const {};
    }

    final rows = await _client
        .from('supplier_locations')
        .select()
        .eq('org_id', orgId)
        .inFilter('id', locationIds);

    final locations = (rows as List)
        .cast<Map<String, dynamic>>()
        .map(SupplierLocation.fromJson)
        .toList();

    return {for (final location in locations) location.id: location};
  }

  void _assertPreferredSupplierConstraint(
    List<CatalogItemSupplierUpsert> suppliers,
  ) {
    final preferredCount = suppliers
        .where((supplier) => supplier.isPreferred)
        .length;
    if (preferredCount > 1) {
      throw ArgumentError(
        'Only one supplier can be preferred for a catalog item.',
      );
    }
  }

  Map<String, dynamic> _itemWriteMap({
    required String orgId,
    required CatalogItemUpsertRequest request,
  }) {
    return {
      'org_id': orgId,
      'name': request.name.trim(),
      'description': request.description?.trim(),
      'unit': request.unit.trim(),
      'default_cost': request.defaultCost,
      'default_sell_price': request.defaultSellPrice,
      'default_markup_pct': request.defaultMarkupPct,
      'waste_pct': request.wastePct,
      'last_price_updated_at': request.lastPriceUpdatedAt
          ?.toUtc()
          .toIso8601String()
          .split('T')
          .first,
      'price_review_frequency_days': request.priceReviewFrequencyDays,
      'price_auto_increase_pct': request.priceAutoIncreasePct,
      'price_auto_increase_months': request.priceAutoIncreaseMonths,
      'price_next_increase_date': request.priceNextIncreaseDate
          ?.toUtc()
          .toIso8601String()
          .split('T')
          .first,
      'color': request.color?.trim(),
      'quantity_type': request.quantityType,
      'round_to': request.roundTo,
      'minimum_qty': request.minimumQty,
      'package_unit': request.packageUnit?.trim(),
      'is_active': request.isActive,
      'sort_order': request.sortOrder,
    };
  }

  DateTime _addMonths(DateTime date, int months) {
    final totalMonths = date.month + months;
    final year = date.year + ((totalMonths - 1) ~/ 12);
    final month = ((totalMonths - 1) % 12) + 1;
    final day = date.day;

    final maxDayForMonth = DateTime.utc(year, month + 1, 0).day;
    final clampedDay = day > maxDayForMonth ? maxDayForMonth : day;

    return DateTime.utc(
      year,
      month,
      clampedDay,
      date.hour,
      date.minute,
      date.second,
      date.millisecond,
      date.microsecond,
    );
  }
}

@riverpod
CatalogItemService catalogItemService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return CatalogItemService(client);
}
