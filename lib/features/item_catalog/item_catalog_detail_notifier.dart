import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'item_catalog_service.dart';
import 'models/item_catalog_models.dart';

part 'item_catalog_detail_notifier.g.dart';

@riverpod
class CatalogItemDetailNotifier extends _$CatalogItemDetailNotifier {
  @override
  Future<CatalogItemDetail?> build(String itemId) async {
    final orgMembership = await ref.watch(orgProvider.future);
    final orgId = orgMembership?.orgId;

    if (orgId == null) {
      return null;
    }

    return ref
        .read(catalogItemServiceProvider)
        .getItemDetail(orgId: orgId, itemId: itemId);
  }

  Future<void> markReviewed() async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    await ref
        .read(catalogItemServiceProvider)
        .markReviewed(orgId: orgId, itemId: itemId);

    ref.invalidateSelf();
  }
}
