import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'helpers/supplier_helpers.dart';
import 'models/item_catalog_models.dart';

part 'supplier_service.g.dart';

class SupplierDetail {
  const SupplierDetail({
    required this.supplier,
    required this.locations,
    required this.itemsCarried,
  });

  final Supplier supplier;
  final List<SupplierLocation> locations;
  final List<CatalogItem> itemsCarried;
}

class SupplierUpsertRequest {
  const SupplierUpsertRequest({
    required this.name,
    this.contactName,
    this.phone,
    this.email,
    this.website,
    this.isActive = true,
  });

  final String name;
  final String? contactName;
  final String? phone;
  final String? email;
  final String? website;
  final bool isActive;
}

class SupplierLocationUpsertRequest {
  const SupplierLocationUpsertRequest({
    required this.name,
    this.streetAddress,
    this.city,
    this.state,
    this.zip,
    this.lat,
    this.lng,
    this.phone,
    this.isPrimary = false,
    this.isActive = true,
  });

  final String name;
  final String? streetAddress;
  final String? city;
  final String? state;
  final String? zip;
  final double? lat;
  final double? lng;
  final String? phone;
  final bool isPrimary;
  final bool isActive;
}

class SupplierService {
  SupplierService(this._client);

  final SupabaseClient _client;

  Future<List<Supplier>> listSuppliers({
    required String orgId,
    String search = '',
    bool activeOnly = false,
  }) async {
    dynamic query = _client.from('suppliers').select().eq('org_id', orgId);

    if (search.trim().isNotEmpty) {
      query = query.ilike('name', '%${search.trim()}%');
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('name');

    final rows = await query;
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(Supplier.fromJson)
        .toList();
  }

  Future<SupplierDetail?> getSupplierDetail({
    required String orgId,
    required String supplierId,
  }) async {
    final supplierRow = await _client
        .from('suppliers')
        .select()
        .eq('org_id', orgId)
        .eq('id', supplierId)
        .maybeSingle();

    if (supplierRow == null) {
      return null;
    }

    final locationRows = await _client
        .from('supplier_locations')
        .select()
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)
        .order('is_primary', ascending: false)
        .order('name');

    final itemRows = await _client
        .from('catalog_item_suppliers')
        .select('catalog_items(*)')
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId);

    final items = (itemRows as List)
        .cast<Map<String, dynamic>>()
        .map((row) => row['catalog_items'])
        .whereType<Map<String, dynamic>>()
        .map(CatalogItem.fromJson)
        .toList();

    return SupplierDetail(
      supplier: Supplier.fromJson(supplierRow),
      locations: (locationRows as List)
          .cast<Map<String, dynamic>>()
          .map(SupplierLocation.fromJson)
          .toList(),
      itemsCarried: items,
    );
  }

  Future<Supplier> createSupplier({
    required String orgId,
    required SupplierUpsertRequest request,
  }) async {
    final row = await _client
        .from('suppliers')
        .insert({
          'org_id': orgId,
          'name': request.name.trim(),
          'contact_name': request.contactName?.trim(),
          'phone': request.phone?.trim(),
          'email': request.email?.trim(),
          'website': request.website?.trim(),
          'is_active': request.isActive,
        })
        .select()
        .single();

    return Supplier.fromJson(row);
  }

  Future<Supplier> updateSupplier({
    required String orgId,
    required String supplierId,
    required SupplierUpsertRequest request,
  }) async {
    final row = await _client
        .from('suppliers')
        .update({
          'name': request.name.trim(),
          'contact_name': request.contactName?.trim(),
          'phone': request.phone?.trim(),
          'email': request.email?.trim(),
          'website': request.website?.trim(),
          'is_active': request.isActive,
        })
        .eq('org_id', orgId)
        .eq('id', supplierId)
        .select()
        .single();

    return Supplier.fromJson(row);
  }

  Future<void> deleteSupplier({
    required String orgId,
    required String supplierId,
  }) {
    return _client
        .from('suppliers')
        .delete()
        .eq('org_id', orgId)
        .eq('id', supplierId);
  }

  Future<List<SupplierLocation>> listLocations({
    required String orgId,
    required String supplierId,
    bool activeOnly = false,
  }) async {
    dynamic query = _client
        .from('supplier_locations')
        .select()
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('is_primary', ascending: false).order('name');

    final rows = await query;
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(SupplierLocation.fromJson)
        .toList();
  }

  Future<SupplierLocation> createLocation({
    required String orgId,
    required String supplierId,
    required SupplierLocationUpsertRequest request,
  }) async {
    if (request.isPrimary) {
      await _clearPrimaryLocation(orgId: orgId, supplierId: supplierId);
    }

    final row = await _client
        .from('supplier_locations')
        .insert({
          'org_id': orgId,
          'supplier_id': supplierId,
          'name': request.name.trim(),
          'street_address': request.streetAddress?.trim(),
          'city': request.city?.trim(),
          'state': request.state?.trim(),
          'zip': request.zip?.trim(),
          'lat': request.lat,
          'lng': request.lng,
          'phone': request.phone?.trim(),
          'is_primary': request.isPrimary,
          'is_active': request.isActive,
        })
        .select()
        .single();

    return SupplierLocation.fromJson(row);
  }

  Future<SupplierLocation> updateLocation({
    required String orgId,
    required String supplierId,
    required String locationId,
    required SupplierLocationUpsertRequest request,
  }) async {
    if (request.isPrimary) {
      await _clearPrimaryLocation(orgId: orgId, supplierId: supplierId);
    }

    final row = await _client
        .from('supplier_locations')
        .update({
          'name': request.name.trim(),
          'street_address': request.streetAddress?.trim(),
          'city': request.city?.trim(),
          'state': request.state?.trim(),
          'zip': request.zip?.trim(),
          'lat': request.lat,
          'lng': request.lng,
          'phone': request.phone?.trim(),
          'is_primary': request.isPrimary,
          'is_active': request.isActive,
        })
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)
        .eq('id', locationId)
        .select()
        .single();

    return SupplierLocation.fromJson(row);
  }

  Future<void> deleteLocation({
    required String orgId,
    required String supplierId,
    required String locationId,
  }) {
    return _client
        .from('supplier_locations')
        .delete()
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)
        .eq('id', locationId);
  }

  Future<SupplierLocation?> getNearestLocation({
    required String orgId,
    required String supplierId,
    required double lat,
    required double lng,
  }) async {
    final locations = await listLocations(
      orgId: orgId,
      supplierId: supplierId,
      activeOnly: true,
    );

    return nearestSupplierLocation(locations, targetLat: lat, targetLng: lng);
  }

  Future<void> _clearPrimaryLocation({
    required String orgId,
    required String supplierId,
  }) {
    return _client
        .from('supplier_locations')
        .update({'is_primary': false})
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)
        .eq('is_primary', true);
  }
}

@riverpod
SupplierService supplierService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return SupplierService(client);
}
