import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'item_catalog_service.dart';
import 'models/item_catalog_models.dart';
import 'partner_service.dart';
import 'supplier_service.dart';

part 'item_catalog_queries.g.dart';

@riverpod
Future<List<CatalogItem>> priceReviewItems(Ref ref) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return [];
  }

  return ref.read(catalogItemServiceProvider).getOverdueItems(orgId: orgId);
}

@riverpod
Future<List<Supplier>> supplierList(Ref ref, {String search = ''}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return [];
  }

  return ref
      .read(supplierServiceProvider)
      .listSuppliers(orgId: orgId, search: search);
}

@riverpod
Future<SupplierDetail?> supplierDetail(Ref ref, String supplierId) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return null;
  }

  return ref
      .read(supplierServiceProvider)
      .getSupplierDetail(orgId: orgId, supplierId: supplierId);
}

@riverpod
Future<List<Partner>> partnerList(Ref ref, {String search = ''}) async {
  final orgMembership = await ref.watch(orgProvider.future);
  final orgId = orgMembership?.orgId;
  if (orgId == null) {
    return [];
  }

  return ref
      .read(partnerServiceProvider)
      .listPartners(orgId: orgId, search: search);
}
