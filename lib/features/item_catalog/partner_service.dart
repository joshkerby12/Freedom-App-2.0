import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'models/item_catalog_models.dart';

part 'partner_service.g.dart';

class PartnerUpsertRequest {
  const PartnerUpsertRequest({
    required this.companyName,
    this.contactName,
    this.phone,
    this.email,
    this.tradeType,
    this.notes,
    this.isActive = true,
  });

  final String companyName;
  final String? contactName;
  final String? phone;
  final String? email;
  final String? tradeType;
  final String? notes;
  final bool isActive;
}

class PartnerService {
  PartnerService(this._client);

  final SupabaseClient _client;

  Future<List<Partner>> listPartners({
    required String orgId,
    String search = '',
    bool activeOnly = false,
  }) async {
    dynamic query = _client.from('partners').select().eq('org_id', orgId);

    if (search.trim().isNotEmpty) {
      query = query.or(
        'company_name.ilike.%${search.trim()}%,trade_type.ilike.%${search.trim()}%',
      );
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('company_name');

    final rows = await query;
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(Partner.fromJson)
        .toList();
  }

  Future<Partner> createPartner({
    required String orgId,
    required PartnerUpsertRequest request,
  }) async {
    final row = await _client
        .from('partners')
        .insert({
          'org_id': orgId,
          'company_name': request.companyName.trim(),
          'contact_name': request.contactName?.trim(),
          'phone': request.phone?.trim(),
          'email': request.email?.trim(),
          'trade_type': request.tradeType?.trim(),
          'notes': request.notes?.trim(),
          'is_active': request.isActive,
        })
        .select()
        .single();

    return Partner.fromJson(row);
  }

  Future<Partner> updatePartner({
    required String orgId,
    required String partnerId,
    required PartnerUpsertRequest request,
  }) async {
    final row = await _client
        .from('partners')
        .update({
          'company_name': request.companyName.trim(),
          'contact_name': request.contactName?.trim(),
          'phone': request.phone?.trim(),
          'email': request.email?.trim(),
          'trade_type': request.tradeType?.trim(),
          'notes': request.notes?.trim(),
          'is_active': request.isActive,
        })
        .eq('org_id', orgId)
        .eq('id', partnerId)
        .select()
        .single();

    return Partner.fromJson(row);
  }

  Future<void> deletePartner({
    required String orgId,
    required String partnerId,
  }) {
    return _client
        .from('partners')
        .delete()
        .eq('org_id', orgId)
        .eq('id', partnerId);
  }
}

@riverpod
PartnerService partnerService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return PartnerService(client);
}
