import 'package:freezed_annotation/freezed_annotation.dart';

part 'item_catalog_models.freezed.dart';
part 'item_catalog_models.g.dart';

@freezed
abstract class CatalogItem with _$CatalogItem {
  const factory CatalogItem({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    String? description,
    required String unit,
    @JsonKey(name: 'default_cost') double? defaultCost,
    @JsonKey(name: 'default_sell_price') double? defaultSellPrice,
    @JsonKey(name: 'default_markup_pct') double? defaultMarkupPct,
    @Default(0) @JsonKey(name: 'waste_pct') double wastePct,
    @JsonKey(name: 'last_price_updated_at') DateTime? lastPriceUpdatedAt,
    @JsonKey(name: 'price_review_frequency_days') int? priceReviewFrequencyDays,
    @JsonKey(name: 'price_auto_increase_pct') double? priceAutoIncreasePct,
    @JsonKey(name: 'price_auto_increase_months') int? priceAutoIncreaseMonths,
    @JsonKey(name: 'price_next_increase_date') DateTime? priceNextIncreaseDate,
    String? color,
    @Default('decimal') @JsonKey(name: 'quantity_type') String quantityType,
    @JsonKey(name: 'round_to') double? roundTo,
    @JsonKey(name: 'minimum_qty') double? minimumQty,
    @JsonKey(name: 'package_unit') String? packageUnit,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _CatalogItem;

  factory CatalogItem.fromJson(Map<String, dynamic> json) =>
      _$CatalogItemFromJson(json);
}

@freezed
abstract class CatalogItemSpec with _$CatalogItemSpec {
  const factory CatalogItemSpec({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'catalog_item_id') required String catalogItemId,
    @JsonKey(name: 'length_in') double? lengthIn,
    @JsonKey(name: 'width_in') double? widthIn,
    @JsonKey(name: 'height_depth_in') double? heightDepthIn,
    @JsonKey(name: 'spread_rate_sqft_per_inch') double? spreadRateSqftPerInch,
    @JsonKey(name: 'face_feet') double? faceFeet,
    @JsonKey(name: 'extra_specs') Map<String, dynamic>? extraSpecs,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _CatalogItemSpec;

  factory CatalogItemSpec.fromJson(Map<String, dynamic> json) =>
      _$CatalogItemSpecFromJson(json);
}

@freezed
abstract class Supplier with _$Supplier {
  const factory Supplier({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    @JsonKey(name: 'contact_name') String? contactName,
    String? phone,
    String? email,
    String? website,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Supplier;

  factory Supplier.fromJson(Map<String, dynamic> json) =>
      _$SupplierFromJson(json);
}

@freezed
abstract class SupplierLocation with _$SupplierLocation {
  const factory SupplierLocation({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'supplier_id') required String supplierId,
    required String name,
    @JsonKey(name: 'street_address') String? streetAddress,
    String? city,
    String? state,
    String? zip,
    double? lat,
    double? lng,
    String? phone,
    @Default(false) @JsonKey(name: 'is_primary') bool isPrimary,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _SupplierLocation;

  factory SupplierLocation.fromJson(Map<String, dynamic> json) =>
      _$SupplierLocationFromJson(json);
}

@freezed
abstract class CatalogItemSupplier with _$CatalogItemSupplier {
  const factory CatalogItemSupplier({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'catalog_item_id') required String catalogItemId,
    @JsonKey(name: 'supplier_id') required String supplierId,
    @JsonKey(name: 'supplier_location_id') String? supplierLocationId,
    @Default(false) @JsonKey(name: 'is_preferred') bool isPreferred,
    @JsonKey(name: 'supplier_sku') String? supplierSku,
    @JsonKey(name: 'supplier_item_name') String? supplierItemName,
    @JsonKey(name: 'unit_cost') double? unitCost,
    @JsonKey(name: 'last_price_date') DateTime? lastPriceDate,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
    Supplier? supplier,
    @JsonKey(name: 'supplier_location') SupplierLocation? supplierLocation,
  }) = _CatalogItemSupplier;

  factory CatalogItemSupplier.fromJson(Map<String, dynamic> json) =>
      _$CatalogItemSupplierFromJson(json);
}

@freezed
abstract class Partner with _$Partner {
  const factory Partner({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'company_name') required String companyName,
    @JsonKey(name: 'contact_name') String? contactName,
    String? phone,
    String? email,
    @JsonKey(name: 'trade_type') String? tradeType,
    String? notes,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Partner;

  factory Partner.fromJson(Map<String, dynamic> json) =>
      _$PartnerFromJson(json);
}

@freezed
abstract class CatalogItemDetail with _$CatalogItemDetail {
  const factory CatalogItemDetail({
    required CatalogItem item,
    CatalogItemSpec? spec,
    @Default(<CatalogItemSupplier>[]) List<CatalogItemSupplier> suppliers,
    double? resolvedUnitPrice,
    @Default(false) bool needsPriceReview,
    int? daysOverdue,
  }) = _CatalogItemDetail;

  factory CatalogItemDetail.fromJson(Map<String, dynamic> json) =>
      _$CatalogItemDetailFromJson(json);
}
