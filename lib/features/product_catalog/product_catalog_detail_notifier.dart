import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'models/product_catalog_models.dart';
import 'product_catalog_service.dart';

part 'product_catalog_detail_notifier.g.dart';

@riverpod
class ProductCatalogDetailNotifier extends _$ProductCatalogDetailNotifier {
  @override
  Future<ProductCatalogDetail?> build(String productId) async {
    final orgMembership = await ref.watch(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return null;
    }

    return ref
        .read(productCatalogServiceProvider)
        .getProductDetail(orgId: orgId, productId: productId);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}
