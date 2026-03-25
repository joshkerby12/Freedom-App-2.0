import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'item_catalog_service.dart';
import 'models/item_catalog_models.dart';

part 'item_catalog_list_notifier.g.dart';

@riverpod
Future<List<CatalogItem>> catalogItemList(
  Ref ref, {
  String search = '',
  bool needsReviewOnly = false,
}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;

  if (orgId == null) {
    return [];
  }

  return ref
      .read(catalogItemServiceProvider)
      .listItems(
        orgId: orgId,
        search: search,
        needsReviewOnly: needsReviewOnly,
      );
}
