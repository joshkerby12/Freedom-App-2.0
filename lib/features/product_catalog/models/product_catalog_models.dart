import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_catalog_models.freezed.dart';
part 'product_catalog_models.g.dart';

@freezed
abstract class ProductCatalog with _$ProductCatalog {
  const factory ProductCatalog({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    required String category,
    @JsonKey(name: 'pricing_mode') @Default('cost_plus') String pricingMode,
    @JsonKey(name: 'install_rate') double? installRate,
    @JsonKey(name: 'minimum_hours') double? minimumHours,
    @JsonKey(name: 'flat_rate_price') double? flatRatePrice,
    @JsonKey(name: 'labor_rate_override') double? laborRateOverride,
    @JsonKey(name: 'equipment_rate_override') double? equipmentRateOverride,
    @JsonKey(name: 'default_description') String? defaultDescription,
    @JsonKey(name: 'quickbooks_item_code') String? quickbooksItemCode,
    @Default(false) @JsonKey(name: 'is_system_template') bool isSystemTemplate,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _ProductCatalog;

  factory ProductCatalog.fromJson(Map<String, dynamic> json) =>
      _$ProductCatalogFromJson(json);
}

@freezed
abstract class ProductCatalogInput with _$ProductCatalogInput {
  const factory ProductCatalogInput({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'product_catalog_id') required String productCatalogId,
    required String label,
    @JsonKey(name: 'input_type') required String inputType,
    @JsonKey(name: 'unit_label') String? unitLabel,
    @Default(true) @JsonKey(name: 'is_required') bool isRequired,
    @JsonKey(name: 'default_value') String? defaultValue,
    @JsonKey(name: 'custom_options') Map<String, dynamic>? customOptions,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _ProductCatalogInput;

  factory ProductCatalogInput.fromJson(Map<String, dynamic> json) =>
      _$ProductCatalogInputFromJson(json);
}

@freezed
abstract class ProductCatalogComponent with _$ProductCatalogComponent {
  const factory ProductCatalogComponent({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'product_catalog_id') required String productCatalogId,
    required String label,
    @JsonKey(name: 'component_type') required String componentType,
    @JsonKey(name: 'catalog_item_id') String? catalogItemId,
    @JsonKey(name: 'input_ref') String? inputRef,
    @JsonKey(name: 'configuration_input_ref') String? configurationInputRef,
    @JsonKey(name: 'qty_formula') required String qtyFormula,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _ProductCatalogComponent;

  factory ProductCatalogComponent.fromJson(Map<String, dynamic> json) =>
      _$ProductCatalogComponentFromJson(json);
}

@freezed
abstract class MaterialConfiguration with _$MaterialConfiguration {
  const factory MaterialConfiguration({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    required String name,
    @JsonKey(name: 'config_type') required String configType,
    String? color,
    @Default(true) @JsonKey(name: 'is_active') bool isActive,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _MaterialConfiguration;

  factory MaterialConfiguration.fromJson(Map<String, dynamic> json) =>
      _$MaterialConfigurationFromJson(json);
}

@freezed
abstract class MaterialConfigurationRole with _$MaterialConfigurationRole {
  const factory MaterialConfigurationRole({
    required String id,
    @JsonKey(name: 'org_id') required String orgId,
    @JsonKey(name: 'configuration_id') required String configurationId,
    @JsonKey(name: 'role_key') required String roleKey,
    @JsonKey(name: 'catalog_item_id') required String catalogItemId,
    @JsonKey(name: 'area_pct') double? areaPct,
    String? orientation,
    @Default(0) @JsonKey(name: 'sort_order') int sortOrder,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _MaterialConfigurationRole;

  factory MaterialConfigurationRole.fromJson(Map<String, dynamic> json) =>
      _$MaterialConfigurationRoleFromJson(json);
}

@freezed
abstract class ProductCatalogDetail with _$ProductCatalogDetail {
  const factory ProductCatalogDetail({
    required ProductCatalog product,
    @Default(<ProductCatalogInput>[]) List<ProductCatalogInput> inputs,
    @Default(<ProductCatalogComponent>[])
    List<ProductCatalogComponent> components,
  }) = _ProductCatalogDetail;

  factory ProductCatalogDetail.fromJson(Map<String, dynamic> json) =>
      _$ProductCatalogDetailFromJson(json);
}
