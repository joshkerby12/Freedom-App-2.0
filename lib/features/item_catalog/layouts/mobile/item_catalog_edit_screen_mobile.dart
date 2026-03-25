import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../orgs/org_notifier.dart';
import '../../item_catalog_detail_notifier.dart';
import '../../item_catalog_list_notifier.dart';
import '../../item_catalog_queries.dart';
import '../../item_catalog_service.dart';

class ItemCatalogEditScreenMobile extends ConsumerStatefulWidget {
  const ItemCatalogEditScreenMobile({super.key, this.itemId});

  final String? itemId;

  @override
  ConsumerState<ItemCatalogEditScreenMobile> createState() =>
      _ItemCatalogEditScreenMobileState();
}

class _ItemCatalogEditScreenMobileState
    extends ConsumerState<ItemCatalogEditScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _unitController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _defaultCostController = TextEditingController();
  final _defaultSellPriceController = TextEditingController();
  final _defaultMarkupController = TextEditingController();
  final _wastePctController = TextEditingController(text: '0');
  final _reviewDaysController = TextEditingController();
  final _colorController = TextEditingController();
  final _roundToController = TextEditingController();
  final _minimumQtyController = TextEditingController();
  final _packageUnitController = TextEditingController();

  final _lengthController = TextEditingController();
  final _widthController = TextEditingController();
  final _heightController = TextEditingController();
  final _spreadRateController = TextEditingController();
  final _faceFeetController = TextEditingController();

  bool _isActive = true;
  String _quantityType = 'decimal';
  bool _isSaving = false;
  bool _didInit = false;
  String? _selectedSupplierId;
  final _supplierCostController = TextEditingController();
  bool _preferredSupplier = true;

  @override
  void dispose() {
    _nameController.dispose();
    _unitController.dispose();
    _descriptionController.dispose();
    _defaultCostController.dispose();
    _defaultSellPriceController.dispose();
    _defaultMarkupController.dispose();
    _wastePctController.dispose();
    _reviewDaysController.dispose();
    _colorController.dispose();
    _roundToController.dispose();
    _minimumQtyController.dispose();
    _packageUnitController.dispose();
    _lengthController.dispose();
    _widthController.dispose();
    _heightController.dispose();
    _spreadRateController.dispose();
    _faceFeetController.dispose();
    _supplierCostController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailState = widget.itemId == null
        ? const AsyncData(null)
        : ref.watch(catalogItemDetailProvider(widget.itemId!));

    final supplierState = ref.watch(supplierListProvider());

    if (!_didInit && detailState.hasValue && detailState.value != null) {
      _didInit = true;
      final detail = detailState.value!;
      final item = detail.item;
      _nameController.text = item.name;
      _unitController.text = item.unit;
      _descriptionController.text = item.description ?? '';
      _defaultCostController.text = item.defaultCost?.toString() ?? '';
      _defaultSellPriceController.text =
          item.defaultSellPrice?.toString() ?? '';
      _defaultMarkupController.text = item.defaultMarkupPct?.toString() ?? '';
      _wastePctController.text = item.wastePct.toString();
      _reviewDaysController.text =
          item.priceReviewFrequencyDays?.toString() ?? '';
      _colorController.text = item.color ?? '';
      _roundToController.text = item.roundTo?.toString() ?? '';
      _minimumQtyController.text = item.minimumQty?.toString() ?? '';
      _packageUnitController.text = item.packageUnit ?? '';
      _quantityType = item.quantityType;
      _isActive = item.isActive;

      final spec = detail.spec;
      if (spec != null) {
        _lengthController.text = spec.lengthIn?.toString() ?? '';
        _widthController.text = spec.widthIn?.toString() ?? '';
        _heightController.text = spec.heightDepthIn?.toString() ?? '';
        _spreadRateController.text =
            spec.spreadRateSqftPerInch?.toString() ?? '';
        _faceFeetController.text = spec.faceFeet?.toString() ?? '';
      }

      final preferred = detail.suppliers
          .where((supplier) => supplier.isPreferred)
          .firstOrNull;
      if (preferred != null) {
        _selectedSupplierId = preferred.supplierId;
        _supplierCostController.text = preferred.unitCost?.toString() ?? '';
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.itemId == null ? 'Add Catalog Item' : 'Edit Catalog Item',
        ),
      ),
      body: detailState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load item: $error')),
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
              TextFormField(
                controller: _unitController,
                decoration: const InputDecoration(labelText: 'Unit *'),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Unit is required'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _defaultCostController,
                decoration: const InputDecoration(labelText: 'Default Cost'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _defaultSellPriceController,
                decoration: const InputDecoration(
                  labelText: 'Default Sell Price',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _defaultMarkupController,
                decoration: const InputDecoration(
                  labelText: 'Default Markup %',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _wastePctController,
                decoration: const InputDecoration(labelText: 'Waste %'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _reviewDaysController,
                decoration: const InputDecoration(
                  labelText: 'Price Review Frequency Days',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _colorController,
                decoration: const InputDecoration(labelText: 'Color'),
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'decimal', label: Text('Decimal')),
                  ButtonSegment(value: 'whole', label: Text('Whole')),
                ],
                selected: {_quantityType},
                onSelectionChanged: (value) {
                  setState(() => _quantityType = value.first);
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _roundToController,
                decoration: const InputDecoration(labelText: 'Round To'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _minimumQtyController,
                decoration: const InputDecoration(labelText: 'Minimum Qty'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _packageUnitController,
                decoration: const InputDecoration(labelText: 'Package Unit'),
              ),
              const SizedBox(height: 20),
              Text('Specs', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lengthController,
                decoration: const InputDecoration(labelText: 'Length (in)'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _widthController,
                decoration: const InputDecoration(labelText: 'Width (in)'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _heightController,
                decoration: const InputDecoration(
                  labelText: 'Height / Depth (in)',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _spreadRateController,
                decoration: const InputDecoration(
                  labelText: 'Spread Rate (sqft/in)',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _faceFeetController,
                decoration: const InputDecoration(labelText: 'Face Feet'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Supplier Link',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              supplierState.when(
                data: (suppliers) {
                  return DropdownButtonFormField<String?>(
                    initialValue: _selectedSupplierId,
                    items: [
                      const DropdownMenuItem<String?>(
                        value: null,
                        child: Text('None'),
                      ),
                      ...suppliers.map(
                        (supplier) => DropdownMenuItem<String?>(
                          value: supplier.id,
                          child: Text(supplier.name),
                        ),
                      ),
                    ],
                    decoration: const InputDecoration(labelText: 'Supplier'),
                    onChanged: (value) {
                      setState(() => _selectedSupplierId = value);
                    },
                  );
                },
                error: (error, _) => Text('Suppliers failed to load: $error'),
                loading: () => const LinearProgressIndicator(),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _supplierCostController,
                decoration: const InputDecoration(
                  labelText: 'Supplier Unit Cost',
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              SwitchListTile(
                value: _preferredSupplier,
                onChanged: (value) =>
                    setState(() => _preferredSupplier = value),
                title: const Text('Preferred Supplier'),
              ),
              SwitchListTile(
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
                title: const Text('Active'),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _isSaving ? null : _save,
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(
                  widget.itemId == null ? 'Create Item' : 'Save Changes',
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

    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null) {
      return;
    }

    setState(() => _isSaving = true);

    final request = CatalogItemUpsertRequest(
      name: _nameController.text,
      unit: _unitController.text,
      description: _descriptionController.text,
      defaultCost: _toDouble(_defaultCostController.text),
      defaultSellPrice: _toDouble(_defaultSellPriceController.text),
      defaultMarkupPct: _toDouble(_defaultMarkupController.text),
      wastePct: _toDouble(_wastePctController.text) ?? 0,
      priceReviewFrequencyDays: _toInt(_reviewDaysController.text),
      color: _colorController.text,
      quantityType: _quantityType,
      roundTo: _toDouble(_roundToController.text),
      minimumQty: _toDouble(_minimumQtyController.text),
      packageUnit: _packageUnitController.text,
      isActive: _isActive,
      spec: CatalogItemSpecUpsert(
        lengthIn: _toDouble(_lengthController.text),
        widthIn: _toDouble(_widthController.text),
        heightDepthIn: _toDouble(_heightController.text),
        spreadRateSqftPerInch: _toDouble(_spreadRateController.text),
        faceFeet: _toDouble(_faceFeetController.text),
      ),
      suppliers: _selectedSupplierId == null
          ? const []
          : [
              CatalogItemSupplierUpsert(
                supplierId: _selectedSupplierId!,
                unitCost: _toDouble(_supplierCostController.text),
                isPreferred: _preferredSupplier,
              ),
            ],
    );

    try {
      final service = ref.read(catalogItemServiceProvider);

      if (widget.itemId == null) {
        final item = await service.createItem(orgId: orgId, request: request);
        if (mounted) {
          ref.invalidate(catalogItemListProvider);
          context.go('${AppRoutes.catalogItems}/${item.id}');
        }
      } else {
        await service.updateItem(
          orgId: orgId,
          itemId: widget.itemId!,
          request: request,
        );

        if (mounted) {
          ref.invalidate(catalogItemDetailProvider(widget.itemId!));
          ref.invalidate(catalogItemListProvider);
          context.go('${AppRoutes.catalogItems}/${widget.itemId}');
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

  int? _toInt(String value) {
    if (value.trim().isEmpty) {
      return null;
    }
    return int.tryParse(value.trim());
  }
}
