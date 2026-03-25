import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/supabase_client_provider.dart';
import 'models/product_catalog_models.dart';

part 'material_config_service.g.dart';

class MaterialConfigRoleUpsertRequest {
  const MaterialConfigRoleUpsertRequest({
    required this.roleKey,
    required this.catalogItemId,
    this.areaPct,
    this.orientation,
    this.sortOrder = 0,
  });

  final String roleKey;
  final String catalogItemId;
  final double? areaPct;
  final String? orientation;
  final int sortOrder;
}

class MaterialConfigUpsertRequest {
  const MaterialConfigUpsertRequest({
    required this.name,
    required this.configType,
    this.color,
    this.isActive = true,
    this.sortOrder = 0,
    this.roles = const [],
  });

  final String name;
  final String configType;
  final String? color;
  final bool isActive;
  final int sortOrder;
  final List<MaterialConfigRoleUpsertRequest> roles;
}

class MaterialConfigurationDetail {
  const MaterialConfigurationDetail({
    required this.configuration,
    required this.roles,
    required this.colorOptions,
  });

  final MaterialConfiguration configuration;
  final List<MaterialConfigurationRole> roles;
  final List<String> colorOptions;
}

class MaterialConfigService {
  MaterialConfigService(this._client);

  final SupabaseClient _client;

  static const Map<String, List<String>> requiredRolesByType = {
    'paver_patio': ['field', 'border_soldier', 'border_sailor'],
    'wall': ['block', 'cap'],
    'flagstone': ['field', 'border'],
    'mulch_bed': ['mulch', 'edging'],
    'sod': ['sod', 'soil_amendment'],
    'rock_bed': ['rock', 'edging'],
    'turf': ['turf', 'infill', 'edging'],
  };

  List<String> requiredRolesForType(String configType) {
    return requiredRolesByType[configType] ?? const [];
  }

  Future<List<MaterialConfiguration>> listConfigurations({
    required String orgId,
    String search = '',
  }) async {
    dynamic query = _client
        .from('material_configurations')
        .select()
        .eq('org_id', orgId);

    if (search.trim().isNotEmpty) {
      query = query.ilike('name', '%${search.trim()}%');
    }

    query = query.order('config_type').order('sort_order').order('name');

    final rows = await query;
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(MaterialConfiguration.fromJson)
        .toList();
  }

  Future<MaterialConfigurationDetail?> getConfigurationDetail({
    required String orgId,
    required String configurationId,
  }) async {
    final configRow = await _client
        .from('material_configurations')
        .select()
        .eq('org_id', orgId)
        .eq('id', configurationId)
        .maybeSingle();

    if (configRow == null) {
      return null;
    }

    final roleRows = await _client
        .from('material_configuration_roles')
        .select()
        .eq('org_id', orgId)
        .eq('configuration_id', configurationId)
        .order('sort_order')
        .order('role_key');

    final roles = (roleRows as List)
        .cast<Map<String, dynamic>>()
        .map(MaterialConfigurationRole.fromJson)
        .toList();

    final colorOptions = await _loadColorOptions(
      orgId: orgId,
      catalogItemIds: roles.map((role) => role.catalogItemId).toList(),
    );

    return MaterialConfigurationDetail(
      configuration: MaterialConfiguration.fromJson(configRow),
      roles: roles,
      colorOptions: colorOptions,
    );
  }

  Future<MaterialConfiguration> createConfiguration({
    required String orgId,
    required MaterialConfigUpsertRequest request,
  }) async {
    _validateRequiredRoles(
      configType: request.configType,
      roles: request.roles.map((role) => role.roleKey).toList(),
    );

    final row = await _client
        .from('material_configurations')
        .insert({
          'org_id': orgId,
          'name': request.name.trim(),
          'config_type': request.configType,
          'color': request.color?.trim(),
          'is_active': request.isActive,
          'sort_order': request.sortOrder,
        })
        .select()
        .single();

    final configuration = MaterialConfiguration.fromJson(row);
    await _replaceRoles(
      orgId: orgId,
      configurationId: configuration.id,
      roles: request.roles,
    );

    return configuration;
  }

  Future<MaterialConfiguration> updateConfiguration({
    required String orgId,
    required String configurationId,
    required MaterialConfigUpsertRequest request,
  }) async {
    _validateRequiredRoles(
      configType: request.configType,
      roles: request.roles.map((role) => role.roleKey).toList(),
    );

    final row = await _client
        .from('material_configurations')
        .update({
          'name': request.name.trim(),
          'config_type': request.configType,
          'color': request.color?.trim(),
          'is_active': request.isActive,
          'sort_order': request.sortOrder,
        })
        .eq('org_id', orgId)
        .eq('id', configurationId)
        .select()
        .single();

    final configuration = MaterialConfiguration.fromJson(row);
    await _replaceRoles(
      orgId: orgId,
      configurationId: configuration.id,
      roles: request.roles,
    );

    return configuration;
  }

  Future<void> deleteConfiguration({
    required String orgId,
    required String configurationId,
  }) {
    return _client
        .from('material_configurations')
        .delete()
        .eq('org_id', orgId)
        .eq('id', configurationId);
  }

  Future<List<String>> previewColors({
    required String orgId,
    required List<String> catalogItemIds,
  }) {
    return _loadColorOptions(orgId: orgId, catalogItemIds: catalogItemIds);
  }

  Future<void> _replaceRoles({
    required String orgId,
    required String configurationId,
    required List<MaterialConfigRoleUpsertRequest> roles,
  }) async {
    await _client
        .from('material_configuration_roles')
        .delete()
        .eq('org_id', orgId)
        .eq('configuration_id', configurationId);

    if (roles.isEmpty) {
      return;
    }

    final rows = roles
        .map(
          (role) => {
            'org_id': orgId,
            'configuration_id': configurationId,
            'role_key': role.roleKey,
            'catalog_item_id': role.catalogItemId,
            'area_pct': role.areaPct,
            'orientation': role.orientation,
            'sort_order': role.sortOrder,
          },
        )
        .toList();

    await _client.from('material_configuration_roles').insert(rows);
  }

  Future<List<String>> _loadColorOptions({
    required String orgId,
    required List<String> catalogItemIds,
  }) async {
    if (catalogItemIds.isEmpty) {
      return [];
    }

    final rows = await _client
        .from('catalog_items')
        .select('color')
        .eq('org_id', orgId)
        .inFilter('id', catalogItemIds)
        .not('color', 'is', null);

    final colors =
        (rows as List)
            .cast<Map<String, dynamic>>()
            .map((row) => row['color'] as String?)
            .whereType<String>()
            .map((color) => color.trim())
            .where((color) => color.isNotEmpty)
            .toSet()
            .toList()
          ..sort();

    return colors;
  }

  void _validateRequiredRoles({
    required String configType,
    required List<String> roles,
  }) {
    final requiredRoles = requiredRolesForType(configType);
    if (requiredRoles.isEmpty) {
      throw ArgumentError('Unknown config type: $configType');
    }

    final roleSet = roles.toSet();
    final missing = requiredRoles
        .where((requiredRole) => !roleSet.contains(requiredRole))
        .toList();

    if (missing.isNotEmpty) {
      throw ArgumentError('Missing required roles: ${missing.join(', ')}');
    }
  }
}

@riverpod
MaterialConfigService materialConfigService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return MaterialConfigService(client);
}
