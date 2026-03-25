import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'models/product_catalog_models.dart';
import 'product_catalog_service.dart';

part 'product_catalog_list_notifier.g.dart';

@riverpod
Future<List<ProductCatalog>> productCatalogList(
  Ref ref, {
  String search = '',
  bool includeInactive = true,
}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return [];
  }

  return ref
      .read(productCatalogServiceProvider)
      .listProducts(
        orgId: orgId,
        search: search,
        includeInactive: includeInactive,
      );
}
