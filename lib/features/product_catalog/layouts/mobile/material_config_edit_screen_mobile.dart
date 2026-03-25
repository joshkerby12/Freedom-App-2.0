import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../item_catalog/item_catalog_list_notifier.dart';
import '../../../orgs/org_notifier.dart';
import '../../material_config_service.dart';
import '../../product_catalog_queries.dart';

class MaterialConfigEditScreenMobile extends ConsumerStatefulWidget {
  const MaterialConfigEditScreenMobile({super.key});

  @override
  ConsumerState<MaterialConfigEditScreenMobile> createState() =>
      _MaterialConfigEditScreenMobileState();
}

class _MaterialConfigEditScreenMobileState
    extends ConsumerState<MaterialConfigEditScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _colorController = TextEditingController();

  String _configType = 'paver_patio';
  bool _isActive = true;
  bool _isSaving = false;
  String? _selectedConfigId;

  final Map<String, String?> _selectedItemByRole = {};
  final Map<String, TextEditingController> _areaPctControllers = {};
  final Map<String, String?> _orientationByRole = {};
  List<String> _colorPreview = [];

  @override
  void initState() {
    super.initState();
    _syncRoleFields();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _colorController.dispose();
    for (final controller in _areaPctControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final configsState = ref.watch(materialConfigurationListProvider());
    final catalogItemsState = ref.watch(catalogItemListProvider());
    final selectedDetailState = _selectedConfigId == null
        ? const AsyncData(null)
        : ref.watch(materialConfigurationDetailProvider(_selectedConfigId!));

    if (_selectedConfigId != null && selectedDetailState.hasValue) {
      final detail = selectedDetailState.value;
      if (detail != null && _nameController.text != detail.configuration.name) {
        _populateFromDetail(detail);
      }
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Material Configurations')),
      body: Row(
        children: [
          SizedBox(
            width: 260,
            child: configsState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Load failed: $error')),
              data: (configs) => ListView(
                children: [
                  ListTile(
                    selected: _selectedConfigId == null,
                    leading: const Icon(Icons.add_circle_outline),
                    title: const Text('New Configuration'),
                    onTap: _resetForm,
                  ),
                  const Divider(height: 0),
                  ...configs.map(
                    (config) => ListTile(
                      selected: _selectedConfigId == config.id,
                      title: Text(config.name),
                      subtitle: Text(config.configType),
                      onTap: () {
                        setState(() {
                          _selectedConfigId = config.id;
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: selectedDetailState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Load failed: $error')),
              data: (_) => catalogItemsState.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) =>
                    Center(child: Text('Catalog load failed: $error')),
                data: (items) => Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Configuration Name *',
                        ),
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                            ? 'Name is required'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _configType,
                        decoration: const InputDecoration(
                          labelText: 'Config Type',
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'paver_patio',
                            child: Text('Paver Patio'),
                          ),
                          DropdownMenuItem(value: 'wall', child: Text('Wall')),
                          DropdownMenuItem(
                            value: 'flagstone',
                            child: Text('Flagstone'),
                          ),
                          DropdownMenuItem(
                            value: 'mulch_bed',
                            child: Text('Mulch Bed'),
                          ),
                          DropdownMenuItem(value: 'sod', child: Text('Sod')),
                          DropdownMenuItem(
                            value: 'rock_bed',
                            child: Text('Rock Bed'),
                          ),
                          DropdownMenuItem(value: 'turf', child: Text('Turf')),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _configType = value;
                              _syncRoleFields();
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _colorController,
                        decoration: const InputDecoration(
                          labelText: 'Color Override',
                        ),
                      ),
                      SwitchListTile(
                        value: _isActive,
                        onChanged: (value) => setState(() => _isActive = value),
                        title: const Text('Active'),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Role Assignments',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      ..._requiredRoles().map(
                        (roleKey) => Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              children: [
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    roleKey,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                DropdownButtonFormField<String>(
                                  initialValue: _selectedItemByRole[roleKey],
                                  decoration: const InputDecoration(
                                    labelText: 'Catalog Item',
                                  ),
                                  items: items
                                      .map(
                                        (item) => DropdownMenuItem(
                                          value: item.id,
                                          child: Text(item.name),
                                        ),
                                      )
                                      .toList(),
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedItemByRole[roleKey] = value;
                                    });
                                  },
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _areaPctControllers[roleKey],
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                  decoration: const InputDecoration(
                                    labelText: 'Area %',
                                  ),
                                ),
                                if (roleKey.contains('border')) ...[
                                  const SizedBox(height: 8),
                                  DropdownButtonFormField<String>(
                                    initialValue: _orientationByRole[roleKey],
                                    decoration: const InputDecoration(
                                      labelText: 'Orientation',
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'soldier',
                                        child: Text('Soldier'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'sailor',
                                        child: Text('Sailor'),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        _orientationByRole[roleKey] = value;
                                      });
                                    },
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.tonalIcon(
                        onPressed: _previewColors,
                        icon: const Icon(Icons.palette_outlined),
                        label: const Text('Preview Colors'),
                      ),
                      if (_colorPreview.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _colorPreview
                              .map((color) => Chip(label: Text(color)))
                              .toList(),
                        ),
                      ],
                      const SizedBox(height: 20),
                      FilledButton.icon(
                        onPressed: _isSaving ? null : _save,
                        icon: _isSaving
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.save_outlined),
                        label: Text(
                          _selectedConfigId == null
                              ? 'Create Configuration'
                              : 'Save Configuration',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<String> _requiredRoles() {
    return ref
        .read(materialConfigServiceProvider)
        .requiredRolesForType(_configType);
  }

  void _syncRoleFields() {
    final requiredRoles = _requiredRoles();

    for (final role in requiredRoles) {
      _selectedItemByRole.putIfAbsent(role, () => null);
      _areaPctControllers.putIfAbsent(role, TextEditingController.new);
      _orientationByRole.putIfAbsent(role, () => null);
    }

    final removeRoles = _selectedItemByRole.keys
        .where((role) => !requiredRoles.contains(role))
        .toList(growable: false);

    for (final role in removeRoles) {
      _selectedItemByRole.remove(role);
      _areaPctControllers.remove(role)?.dispose();
      _orientationByRole.remove(role);
    }
  }

  void _populateFromDetail(MaterialConfigurationDetail detail) {
    _selectedConfigId = detail.configuration.id;
    _nameController.text = detail.configuration.name;
    _configType = detail.configuration.configType;
    _colorController.text = detail.configuration.color ?? '';
    _isActive = detail.configuration.isActive;

    _syncRoleFields();
    for (final role in detail.roles) {
      _selectedItemByRole[role.roleKey] = role.catalogItemId;
      _areaPctControllers[role.roleKey]?.text = role.areaPct?.toString() ?? '';
      _orientationByRole[role.roleKey] = role.orientation;
    }

    _colorPreview = detail.colorOptions;
  }

  void _resetForm() {
    setState(() {
      _selectedConfigId = null;
      _nameController.clear();
      _colorController.clear();
      _configType = 'paver_patio';
      _isActive = true;
      _selectedItemByRole.clear();
      for (final controller in _areaPctControllers.values) {
        controller.dispose();
      }
      _areaPctControllers.clear();
      _orientationByRole.clear();
      _colorPreview = [];
      _syncRoleFields();
    });
  }

  Future<void> _previewColors() async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    final itemIds = _selectedItemByRole.values.whereType<String>().toList();
    final colors = await ref
        .read(materialConfigServiceProvider)
        .previewColors(orgId: orgId, catalogItemIds: itemIds);

    setState(() => _colorPreview = colors);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final messenger = ScaffoldMessenger.of(context);

    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    final requiredRoles = _requiredRoles();
    final missingRoles = requiredRoles
        .where((role) => _selectedItemByRole[role] == null)
        .toList(growable: false);

    if (missingRoles.isNotEmpty) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            'Missing item assignments for: ${missingRoles.join(', ')}',
          ),
        ),
      );
      return;
    }

    final roles = requiredRoles
        .map(
          (role) => MaterialConfigRoleUpsertRequest(
            roleKey: role,
            catalogItemId: _selectedItemByRole[role]!,
            areaPct: double.tryParse(_areaPctControllers[role]?.text ?? ''),
            orientation: _orientationByRole[role],
            sortOrder: requiredRoles.indexOf(role),
          ),
        )
        .toList();

    final request = MaterialConfigUpsertRequest(
      name: _nameController.text,
      configType: _configType,
      color: _colorController.text,
      isActive: _isActive,
      roles: roles,
    );

    setState(() => _isSaving = true);
    try {
      final service = ref.read(materialConfigServiceProvider);
      if (_selectedConfigId == null) {
        final created = await service.createConfiguration(
          orgId: orgId,
          request: request,
        );
        _selectedConfigId = created.id;
      } else {
        await service.updateConfiguration(
          orgId: orgId,
          configurationId: _selectedConfigId!,
          request: request,
        );
      }

      ref.invalidate(materialConfigurationListProvider());
      if (_selectedConfigId != null) {
        ref.invalidate(materialConfigurationDetailProvider(_selectedConfigId!));
      }

      await _previewColors();

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Configuration saved')),
        );
      }
    } catch (error) {
      if (mounted) {
        messenger.showSnackBar(SnackBar(content: Text('Save failed: $error')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }
}
