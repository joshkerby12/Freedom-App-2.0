import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'helpers/formula_engine.dart';
import 'models/product_catalog_models.dart';

part 'product_catalog_service.g.dart';

class ProductCatalogInputUpsertRequest {
  const ProductCatalogInputUpsertRequest({
    required this.label,
    required this.inputType,
    this.unitLabel,
    this.isRequired = true,
    this.defaultValue,
    this.customOptions,
    this.sortOrder = 0,
  });

  final String label;
  final String inputType;
  final String? unitLabel;
  final bool isRequired;
  final String? defaultValue;
  final Map<String, dynamic>? customOptions;
  final int sortOrder;
}

class ProductCatalogComponentUpsertRequest {
  const ProductCatalogComponentUpsertRequest({
    required this.label,
    required this.componentType,
    required this.qtyFormula,
    this.catalogItemId,
    this.inputRef,
    this.configurationInputRef,
    this.sortOrder = 0,
  });

  final String label;
  final String componentType;
  final String qtyFormula;
  final String? catalogItemId;
  final String? inputRef;
  final String? configurationInputRef;
  final int sortOrder;
}

class ProductCatalogUpsertRequest {
  const ProductCatalogUpsertRequest({
    required this.name,
    required this.category,
    required this.pricingMode,
    this.installRate,
    this.minimumHours,
    this.flatRatePrice,
    this.laborRateOverride,
    this.equipmentRateOverride,
    this.defaultDescription,
    this.quickbooksItemCode,
    this.isActive = true,
    this.sortOrder = 0,
    this.inputs = const [],
    this.components = const [],
  });

  final String name;
  final String category;
  final String pricingMode;
  final double? installRate;
  final double? minimumHours;
  final double? flatRatePrice;
  final double? laborRateOverride;
  final double? equipmentRateOverride;
  final String? defaultDescription;
  final String? quickbooksItemCode;
  final bool isActive;
  final int sortOrder;
  final List<ProductCatalogInputUpsertRequest> inputs;
  final List<ProductCatalogComponentUpsertRequest> components;
}

class ProductCatalogService {
  ProductCatalogService(this._client);

  final SupabaseClient _client;

  Future<List<ProductCatalog>> listProducts({
    required String orgId,
    String search = '',
    bool includeInactive = false,
  }) async {
    dynamic query = _client
        .from('product_catalog')
        .select()
        .eq('org_id', orgId);

    if (search.trim().isNotEmpty) {
      query = query.ilike('name', '%${search.trim()}%');
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('category').order('sort_order').order('name');

    final rows = await query;
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(ProductCatalog.fromJson)
        .toList();
  }

  Future<Map<String, List<ProductCatalog>>> listProductsGroupedByCategory({
    required String orgId,
    String search = '',
    bool includeInactive = false,
  }) async {
    final products = await listProducts(
      orgId: orgId,
      search: search,
      includeInactive: includeInactive,
    );

    final grouped = <String, List<ProductCatalog>>{};
    for (final product in products) {
      grouped.putIfAbsent(product.category, () => []).add(product);
    }

    return grouped;
  }

  Future<ProductCatalogDetail?> getProductDetail({
    required String orgId,
    required String productId,
  }) async {
    final productRow = await _client
        .from('product_catalog')
        .select()
        .eq('org_id', orgId)
        .eq('id', productId)
        .maybeSingle();

    if (productRow == null) {
      return null;
    }

    final inputRows = await _client
        .from('product_catalog_inputs')
        .select()
        .eq('org_id', orgId)
        .eq('product_catalog_id', productId)
        .order('sort_order')
        .order('label');

    final componentRows = await _client
        .from('product_catalog_components')
        .select()
        .eq('org_id', orgId)
        .eq('product_catalog_id', productId)
        .order('sort_order')
        .order('label');

    return ProductCatalogDetail(
      product: ProductCatalog.fromJson(productRow),
      inputs: (inputRows as List)
          .cast<Map<String, dynamic>>()
          .map(ProductCatalogInput.fromJson)
          .toList(),
      components: (componentRows as List)
          .cast<Map<String, dynamic>>()
          .map(ProductCatalogComponent.fromJson)
          .toList(),
    );
  }

  Future<ProductCatalog> createProduct({
    required String orgId,
    required ProductCatalogUpsertRequest request,
    bool isSystemTemplate = false,
  }) async {
    final row = await _client
        .from('product_catalog')
        .insert({
          'org_id': orgId,
          'name': request.name.trim(),
          'category': request.category,
          'pricing_mode': request.pricingMode,
          'install_rate': request.installRate,
          'minimum_hours': request.minimumHours,
          'flat_rate_price': request.flatRatePrice,
          'labor_rate_override': request.laborRateOverride,
          'equipment_rate_override': request.equipmentRateOverride,
          'default_description': request.defaultDescription?.trim(),
          'quickbooks_item_code': request.quickbooksItemCode?.trim(),
          'is_system_template': isSystemTemplate,
          'is_active': request.isActive,
          'sort_order': request.sortOrder,
        })
        .select()
        .single();

    final product = ProductCatalog.fromJson(row);
    await _replaceInputsAndComponents(
      orgId: orgId,
      productId: product.id,
      inputs: request.inputs,
      components: request.components,
    );

    return product;
  }

  Future<ProductCatalog> updateProduct({
    required String orgId,
    required String productId,
    required ProductCatalogUpsertRequest request,
  }) async {
    final row = await _client
        .from('product_catalog')
        .update({
          'name': request.name.trim(),
          'category': request.category,
          'pricing_mode': request.pricingMode,
          'install_rate': request.installRate,
          'minimum_hours': request.minimumHours,
          'flat_rate_price': request.flatRatePrice,
          'labor_rate_override': request.laborRateOverride,
          'equipment_rate_override': request.equipmentRateOverride,
          'default_description': request.defaultDescription?.trim(),
          'quickbooks_item_code': request.quickbooksItemCode?.trim(),
          'is_active': request.isActive,
          'sort_order': request.sortOrder,
        })
        .eq('org_id', orgId)
        .eq('id', productId)
        .select()
        .single();

    final product = ProductCatalog.fromJson(row);
    await _replaceInputsAndComponents(
      orgId: orgId,
      productId: product.id,
      inputs: request.inputs,
      components: request.components,
    );

    return product;
  }

  Future<void> deleteProduct({
    required String orgId,
    required String productId,
  }) async {
    final product = await _client
        .from('product_catalog')
        .select('is_system_template')
        .eq('org_id', orgId)
        .eq('id', productId)
        .maybeSingle();

    if (product == null) {
      return;
    }

    final isSystemTemplate = product['is_system_template'] as bool? ?? false;
    if (isSystemTemplate) {
      throw StateError('System templates cannot be deleted.');
    }

    await _client
        .from('product_catalog')
        .delete()
        .eq('org_id', orgId)
        .eq('id', productId);
  }

  FormulaResult evaluateFormula(String formula, Map<String, double> variables) {
    return FormulaEngine.evaluate(formula, variables);
  }

  Future<FormulaResult> evaluateProductComponent({
    required String orgId,
    required String productId,
    required String componentId,
    required Map<String, double> variables,
  }) async {
    final row = await _client
        .from('product_catalog_components')
        .select('qty_formula, product_catalog_id')
        .eq('org_id', orgId)
        .eq('id', componentId)
        .eq('product_catalog_id', productId)
        .maybeSingle();

    if (row == null) {
      return const FormulaResult.failure('Component not found.');
    }

    final formula = row['qty_formula'] as String?;
    if (formula == null || formula.trim().isEmpty) {
      return const FormulaResult.failure('Component formula is empty.');
    }

    return evaluateFormula(formula, variables);
  }

  Future<void> _replaceInputsAndComponents({
    required String orgId,
    required String productId,
    required List<ProductCatalogInputUpsertRequest> inputs,
    required List<ProductCatalogComponentUpsertRequest> components,
  }) async {
    await _client
        .from('product_catalog_inputs')
        .delete()
        .eq('org_id', orgId)
        .eq('product_catalog_id', productId);

    await _client
        .from('product_catalog_components')
        .delete()
        .eq('org_id', orgId)
        .eq('product_catalog_id', productId);

    if (inputs.isNotEmpty) {
      final inputRows = inputs
          .map(
            (input) => {
              'org_id': orgId,
              'product_catalog_id': productId,
              'label': input.label.trim(),
              'input_type': input.inputType,
              'unit_label': input.unitLabel?.trim(),
              'is_required': input.isRequired,
              'default_value': input.defaultValue,
              'custom_options': input.customOptions,
              'sort_order': input.sortOrder,
            },
          )
          .toList();

      await _client.from('product_catalog_inputs').insert(inputRows);
    }

    if (components.isNotEmpty) {
      final componentRows = components
          .map(
            (component) => {
              'org_id': orgId,
              'product_catalog_id': productId,
              'label': component.label.trim(),
              'component_type': component.componentType,
              'catalog_item_id': component.catalogItemId,
              'input_ref': component.inputRef,
              'configuration_input_ref': component.configurationInputRef,
              'qty_formula': component.qtyFormula.trim(),
              'sort_order': component.sortOrder,
            },
          )
          .toList();

      await _client.from('product_catalog_components').insert(componentRows);
    }
  }
}

@riverpod
ProductCatalogService productCatalogService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return ProductCatalogService(client);
}
