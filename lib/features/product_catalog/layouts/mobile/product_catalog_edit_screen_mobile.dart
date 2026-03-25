import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../orgs/org_notifier.dart';
import '../../models/product_catalog_models.dart';
import '../../product_catalog_detail_notifier.dart';
import '../../product_catalog_queries.dart';
import '../../product_catalog_service.dart';

class ProductCatalogEditScreenMobile extends ConsumerStatefulWidget {
  const ProductCatalogEditScreenMobile({super.key, this.productId});

  final String? productId;

  @override
  ConsumerState<ProductCatalogEditScreenMobile> createState() =>
      _ProductCatalogEditScreenMobileState();
}

class _ProductCatalogEditScreenMobileState
    extends ConsumerState<ProductCatalogEditScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _installRateController = TextEditingController();
  final _minimumHoursController = TextEditingController();
  final _flatRateController = TextEditingController();
  final _laborRateController = TextEditingController();
  final _equipmentRateController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _qbCodeController = TextEditingController();

  String _category = 'hardscape';
  String _pricingMode = 'cost_plus';
  bool _isActive = true;
  bool _didInit = false;
  bool _isSaving = false;

  final List<_InputDraft> _inputDrafts = [];
  final List<_ComponentDraft> _componentDrafts = [];

  @override
  void dispose() {
    _nameController.dispose();
    _installRateController.dispose();
    _minimumHoursController.dispose();
    _flatRateController.dispose();
    _laborRateController.dispose();
    _equipmentRateController.dispose();
    _descriptionController.dispose();
    _qbCodeController.dispose();
    for (final draft in _inputDrafts) {
      draft.dispose();
    }
    for (final draft in _componentDrafts) {
      draft.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailState = widget.productId == null
        ? const AsyncData(null)
        : ref.watch(productCatalogDetailProvider(widget.productId!));

    if (!_didInit && detailState.hasValue && detailState.value != null) {
      _didInit = true;
      final detail = detailState.value!;
      final product = detail.product;

      _nameController.text = product.name;
      _category = product.category;
      _pricingMode = product.pricingMode;
      _installRateController.text = product.installRate?.toString() ?? '';
      _minimumHoursController.text = product.minimumHours?.toString() ?? '';
      _flatRateController.text = product.flatRatePrice?.toString() ?? '';
      _laborRateController.text = product.laborRateOverride?.toString() ?? '';
      _equipmentRateController.text =
          product.equipmentRateOverride?.toString() ?? '';
      _descriptionController.text = product.defaultDescription ?? '';
      _qbCodeController.text = product.quickbooksItemCode ?? '';
      _isActive = product.isActive;

      _inputDrafts
        ..clear()
        ..addAll(
          detail.inputs
              .map((input) => _InputDraft.fromModel(input))
              .toList(growable: false),
        );

      _componentDrafts
        ..clear()
        ..addAll(
          detail.components
              .map((component) => _ComponentDraft.fromModel(component))
              .toList(growable: false),
        );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.productId == null ? 'Add Product' : 'Edit Product'),
      ),
      body: detailState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load product: $error')),
        data: (_) => Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Name *'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Name is required'
                    : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(
                    value: 'hardscape',
                    child: Text('Hardscape'),
                  ),
                  DropdownMenuItem(
                    value: 'softscape',
                    child: Text('Softscape'),
                  ),
                  DropdownMenuItem(value: 'drainage', child: Text('Drainage')),
                  DropdownMenuItem(
                    value: 'maintenance',
                    child: Text('Maintenance'),
                  ),
                  DropdownMenuItem(value: 'snow', child: Text('Snow')),
                  DropdownMenuItem(
                    value: 'irrigation',
                    child: Text('Irrigation'),
                  ),
                  DropdownMenuItem(value: 'other', child: Text('Other')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _category = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _pricingMode,
                decoration: const InputDecoration(labelText: 'Pricing Mode'),
                items: const [
                  DropdownMenuItem(
                    value: 'cost_plus',
                    child: Text('Cost Plus'),
                  ),
                  DropdownMenuItem(
                    value: 'flat_rate',
                    child: Text('Flat Rate'),
                  ),
                  DropdownMenuItem(value: 'per_sf', child: Text('Per SF')),
                  DropdownMenuItem(value: 't_and_m', child: Text('T&M')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _pricingMode = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _installRateController,
                decoration: const InputDecoration(labelText: 'Install Rate'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _minimumHoursController,
                decoration: const InputDecoration(labelText: 'Minimum Hours'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              if (_pricingMode == 'flat_rate')
                TextFormField(
                  controller: _flatRateController,
                  decoration: const InputDecoration(
                    labelText: 'Flat Rate Price',
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _laborRateController,
                decoration: const InputDecoration(
                  labelText: 'Labor Rate Override',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _equipmentRateController,
                decoration: const InputDecoration(
                  labelText: 'Equipment Rate Override',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Default Description',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _qbCodeController,
                decoration: const InputDecoration(labelText: 'QB Item Code'),
              ),
              SwitchListTile(
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
                title: const Text('Active'),
              ),
              const SizedBox(height: 20),
              _InputsSection(
                inputDrafts: _inputDrafts,
                onChanged: () => setState(() {}),
              ),
              const SizedBox(height: 20),
              _ComponentsSection(
                componentDrafts: _componentDrafts,
                onChanged: () => setState(() {}),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _isSaving ? null : _save,
                icon: _isSaving
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(
                  widget.productId == null ? 'Create Product' : 'Save Product',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    for (final component in _componentDrafts) {
      if (component.qtyFormulaController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Each component requires a formula.')),
        );
        return;
      }
    }

    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    final request = ProductCatalogUpsertRequest(
      name: _nameController.text,
      category: _category,
      pricingMode: _pricingMode,
      installRate: _toDouble(_installRateController.text),
      minimumHours: _toDouble(_minimumHoursController.text),
      flatRatePrice: _toDouble(_flatRateController.text),
      laborRateOverride: _toDouble(_laborRateController.text),
      equipmentRateOverride: _toDouble(_equipmentRateController.text),
      defaultDescription: _descriptionController.text,
      quickbooksItemCode: _qbCodeController.text,
      isActive: _isActive,
      inputs: _inputDrafts
          .asMap()
          .entries
          .map(
            (entry) => ProductCatalogInputUpsertRequest(
              label: entry.value.labelController.text,
              inputType: entry.value.inputType,
              unitLabel: entry.value.unitController.text,
              isRequired: entry.value.isRequired,
              defaultValue: entry.value.defaultController.text,
              customOptions: entry.value.inputType == 'custom_dropdown'
                  ? {
                      'options': entry.value.customOptionsController.text
                          .split(',')
                          .map((e) => e.trim())
                          .where((e) => e.isNotEmpty)
                          .toList(),
                    }
                  : null,
              sortOrder: entry.key,
            ),
          )
          .toList(),
      components: _componentDrafts
          .asMap()
          .entries
          .map(
            (entry) => ProductCatalogComponentUpsertRequest(
              label: entry.value.labelController.text,
              componentType: entry.value.componentType,
              qtyFormula: entry.value.qtyFormulaController.text,
              inputRef: entry.value.inputRefController.text,
              sortOrder: entry.key,
            ),
          )
          .toList(),
    );

    setState(() => _isSaving = true);
    try {
      final service = ref.read(productCatalogServiceProvider);
      if (widget.productId == null) {
        final product = await service.createProduct(
          orgId: orgId,
          request: request,
        );
        if (mounted) {
          ref.invalidate(productCatalogGroupedListProvider());
          context.go('${AppRoutes.catalogProducts}/${product.id}');
        }
      } else {
        await service.updateProduct(
          orgId: orgId,
          productId: widget.productId!,
          request: request,
        );

        if (mounted) {
          ref.invalidate(productCatalogGroupedListProvider());
          ref.invalidate(productCatalogDetailProvider(widget.productId!));
          context.go('${AppRoutes.catalogProducts}/${widget.productId}');
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Save failed: $error')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  double? _toDouble(String value) {
    if (value.trim().isEmpty) {
      return null;
    }
    return double.tryParse(value.trim());
  }
}

class _InputsSection extends StatelessWidget {
  const _InputsSection({required this.inputDrafts, required this.onChanged});

  final List<_InputDraft> inputDrafts;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Inputs', style: Theme.of(context).textTheme.titleMedium),
            TextButton.icon(
              onPressed: () {
                inputDrafts.add(_InputDraft());
                onChanged();
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Input'),
            ),
          ],
        ),
        if (inputDrafts.isEmpty)
          const Text('No inputs yet')
        else
          ...inputDrafts.asMap().entries.map((entry) {
            final index = entry.key;
            final draft = entry.value;

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 6),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextFormField(
                      controller: draft.labelController,
                      decoration: InputDecoration(
                        labelText: 'Input ${index + 1} Label',
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: draft.inputType,
                      items: const [
                        DropdownMenuItem(
                          value: 'number',
                          child: Text('Number'),
                        ),
                        DropdownMenuItem(
                          value: 'item_dropdown',
                          child: Text('Item Dropdown'),
                        ),
                        DropdownMenuItem(
                          value: 'color_dropdown',
                          child: Text('Color Dropdown'),
                        ),
                        DropdownMenuItem(
                          value: 'config_dropdown',
                          child: Text('Config Dropdown'),
                        ),
                        DropdownMenuItem(
                          value: 'custom_dropdown',
                          child: Text('Custom Dropdown'),
                        ),
                        DropdownMenuItem(value: 'text', child: Text('Text')),
                      ],
                      decoration: const InputDecoration(
                        labelText: 'Input Type',
                      ),
                      onChanged: (value) {
                        if (value != null) {
                          draft.inputType = value;
                          onChanged();
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: draft.unitController,
                      decoration: const InputDecoration(
                        labelText: 'Unit Label',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: draft.defaultController,
                      decoration: const InputDecoration(
                        labelText: 'Default Value',
                      ),
                    ),
                    if (draft.inputType == 'custom_dropdown') ...[
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: draft.customOptionsController,
                        decoration: const InputDecoration(
                          labelText: 'Custom Options (comma-separated)',
                        ),
                      ),
                    ],
                    SwitchListTile(
                      value: draft.isRequired,
                      onChanged: (value) {
                        draft.isRequired = value;
                        onChanged();
                      },
                      title: const Text('Required'),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: () {
                          draft.dispose();
                          inputDrafts.removeAt(index);
                          onChanged();
                        },
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Remove'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _ComponentsSection extends StatelessWidget {
  const _ComponentsSection({
    required this.componentDrafts,
    required this.onChanged,
  });

  final List<_ComponentDraft> componentDrafts;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Components', style: Theme.of(context).textTheme.titleMedium),
            TextButton.icon(
              onPressed: () {
                componentDrafts.add(_ComponentDraft());
                onChanged();
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Component'),
            ),
          ],
        ),
        if (componentDrafts.isEmpty)
          const Text('No components yet')
        else
          ...componentDrafts.asMap().entries.map((entry) {
            final index = entry.key;
            final draft = entry.value;

            return Card(
              margin: const EdgeInsets.symmetric(vertical: 6),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextFormField(
                      controller: draft.labelController,
                      decoration: InputDecoration(
                        labelText: 'Component ${index + 1} Label',
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: draft.componentType,
                      items: const [
                        DropdownMenuItem(
                          value: 'catalog_item',
                          child: Text('Catalog Item'),
                        ),
                        DropdownMenuItem(
                          value: 'material_configuration',
                          child: Text('Material Configuration'),
                        ),
                        DropdownMenuItem(value: 'labor', child: Text('Labor')),
                        DropdownMenuItem(
                          value: 'equipment',
                          child: Text('Equipment'),
                        ),
                        DropdownMenuItem(
                          value: 'partner',
                          child: Text('Partner'),
                        ),
                      ],
                      decoration: const InputDecoration(
                        labelText: 'Component Type',
                      ),
                      onChanged: (value) {
                        if (value != null) {
                          draft.componentType = value;
                          onChanged();
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: draft.inputRefController,
                      decoration: const InputDecoration(
                        labelText: 'Input Ref (optional)',
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: draft.qtyFormulaController,
                      decoration: const InputDecoration(
                        labelText: 'Qty Formula *',
                        helperText:
                            'Example: area / spread_rate_sqft_per_inch * depth',
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: () {
                          draft.dispose();
                          componentDrafts.removeAt(index);
                          onChanged();
                        },
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Remove'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _InputDraft {
  _InputDraft()
    : labelController = TextEditingController(),
      unitController = TextEditingController(),
      defaultController = TextEditingController(),
      customOptionsController = TextEditingController();

  _InputDraft.fromModel(ProductCatalogInput input)
    : labelController = TextEditingController(text: input.label),
      unitController = TextEditingController(text: input.unitLabel ?? ''),
      defaultController = TextEditingController(text: input.defaultValue ?? ''),
      customOptionsController = TextEditingController(
        text:
            (input.customOptions?['options'] as List<dynamic>?)
                ?.map((e) => '$e')
                .join(', ') ??
            '',
      ),
      inputType = input.inputType,
      isRequired = input.isRequired;

  final TextEditingController labelController;
  final TextEditingController unitController;
  final TextEditingController defaultController;
  final TextEditingController customOptionsController;
  String inputType = 'number';
  bool isRequired = true;

  void dispose() {
    labelController.dispose();
    unitController.dispose();
    defaultController.dispose();
    customOptionsController.dispose();
  }
}

class _ComponentDraft {
  _ComponentDraft()
    : labelController = TextEditingController(),
      inputRefController = TextEditingController(),
      qtyFormulaController = TextEditingController();

  _ComponentDraft.fromModel(ProductCatalogComponent component)
    : labelController = TextEditingController(text: component.label),
      inputRefController = TextEditingController(
        text: component.inputRef ?? '',
      ),
      qtyFormulaController = TextEditingController(text: component.qtyFormula),
      componentType = component.componentType;

  final TextEditingController labelController;
  final TextEditingController inputRefController;
  final TextEditingController qtyFormulaController;
  String componentType = 'catalog_item';

  void dispose() {
    labelController.dispose();
    inputRefController.dispose();
    qtyFormulaController.dispose();
  }
}
