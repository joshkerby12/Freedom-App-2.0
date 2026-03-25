import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'material_config_service.dart';
import 'models/product_catalog_models.dart';
import 'product_catalog_service.dart';

part 'product_catalog_queries.g.dart';

@riverpod
Future<Map<String, List<ProductCatalog>>> productCatalogGroupedList(
  Ref ref, {
  String search = '',
  bool includeInactive = true,
}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return {};
  }

  return ref
      .read(productCatalogServiceProvider)
      .listProductsGroupedByCategory(
        orgId: orgId,
        search: search,
        includeInactive: includeInactive,
      );
}

@riverpod
Future<List<MaterialConfiguration>> materialConfigurationList(
  Ref ref, {
  String search = '',
}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return [];
  }

  return ref
      .read(materialConfigServiceProvider)
      .listConfigurations(orgId: orgId, search: search);
}

@riverpod
Future<MaterialConfigurationDetail?> materialConfigurationDetail(
  Ref ref,
  String configurationId,
) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return null;
  }

  return ref
      .read(materialConfigServiceProvider)
      .getConfigurationDetail(orgId: orgId, configurationId: configurationId);
}
