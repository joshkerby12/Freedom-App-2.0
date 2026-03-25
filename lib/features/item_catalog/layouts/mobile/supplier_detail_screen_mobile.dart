import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../orgs/org_notifier.dart';
import '../../item_catalog_queries.dart';
import '../../supplier_service.dart';

class SupplierDetailScreenMobile extends ConsumerStatefulWidget {
  const SupplierDetailScreenMobile({super.key, this.supplierId});

  final String? supplierId;

  @override
  ConsumerState<SupplierDetailScreenMobile> createState() =>
      _SupplierDetailScreenMobileState();
}

class _SupplierDetailScreenMobileState
    extends ConsumerState<SupplierDetailScreenMobile> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _contactController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _websiteController = TextEditingController();

  bool _isActive = true;
  bool _didInit = false;
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _contactController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailState = widget.supplierId == null
        ? const AsyncData(null)
        : ref.watch(supplierDetailProvider(widget.supplierId!));

    if (!_didInit && detailState.hasValue && detailState.value != null) {
      _didInit = true;
      final supplier = detailState.value!.supplier;
      _nameController.text = supplier.name;
      _contactController.text = supplier.contactName ?? '';
      _phoneController.text = supplier.phone ?? '';
      _emailController.text = supplier.email ?? '';
      _websiteController.text = supplier.website ?? '';
      _isActive = supplier.isActive;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.supplierId == null ? 'Add Supplier' : 'Supplier Detail',
        ),
      ),
      body: detailState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Failed to load supplier: $error')),
        data: (detail) => Form(
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
                controller: _contactController,
                decoration: const InputDecoration(labelText: 'Contact Name'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _websiteController,
                decoration: const InputDecoration(labelText: 'Website'),
              ),
              SwitchListTile(
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
                title: const Text('Active'),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: _saving
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(
                  widget.supplierId == null
                      ? 'Create Supplier'
                      : 'Save Supplier',
                ),
              ),
              if (detail != null) ...[
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Locations',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    TextButton.icon(
                      onPressed: () => _showLocationDialog(),
                      icon: const Icon(Icons.add_location_alt_outlined),
                      label: const Text('Add Location'),
                    ),
                  ],
                ),
                if (detail.locations.isEmpty)
                  const Text('No locations yet')
                else
                  ...detail.locations.map(
                    (location) => Card(
                      child: ListTile(
                        title: Text(location.name),
                        subtitle: Text(
                          '${location.streetAddress ?? ''} ${location.city ?? ''} ${location.state ?? ''}',
                        ),
                        trailing: location.isPrimary
                            ? const Chip(label: Text('Primary'))
                            : null,
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Text(
                  'Items Carried',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (detail.itemsCarried.isEmpty)
                  const Text('No catalog items linked yet')
                else
                  ...detail.itemsCarried.map(
                    (item) => ListTile(title: Text(item.name)),
                  ),
              ],
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

    final request = SupplierUpsertRequest(
      name: _nameController.text,
      contactName: _contactController.text,
      phone: _phoneController.text,
      email: _emailController.text,
      website: _websiteController.text,
      isActive: _isActive,
    );

    setState(() => _saving = true);
    try {
      final service = ref.read(supplierServiceProvider);
      if (widget.supplierId == null) {
        final supplier = await service.createSupplier(
          orgId: orgId,
          request: request,
        );
        if (mounted) {
          ref.invalidate(supplierListProvider());
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Supplier ${supplier.name} created')),
          );
        }
      } else {
        await service.updateSupplier(
          orgId: orgId,
          supplierId: widget.supplierId!,
          request: request,
        );

        ref.invalidate(supplierDetailProvider(widget.supplierId!));
        ref.invalidate(supplierListProvider());
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Supplier saved')));
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
        setState(() => _saving = false);
      }
    }
  }

  Future<void> _showLocationDialog() async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    final supplierId = widget.supplierId;
    if (orgId == null || supplierId == null || !mounted) {
      return;
    }

    final nameController = TextEditingController();
    final streetController = TextEditingController();
    final cityController = TextEditingController();
    final stateController = TextEditingController();
    final zipController = TextEditingController();
    final latController = TextEditingController();
    final lngController = TextEditingController();
    bool isPrimary = false;

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Location'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(labelText: 'Name'),
                    ),
                    TextField(
                      controller: streetController,
                      decoration: const InputDecoration(labelText: 'Street'),
                    ),
                    TextField(
                      controller: cityController,
                      decoration: const InputDecoration(labelText: 'City'),
                    ),
                    TextField(
                      controller: stateController,
                      decoration: const InputDecoration(labelText: 'State'),
                    ),
                    TextField(
                      controller: zipController,
                      decoration: const InputDecoration(labelText: 'Zip'),
                    ),
                    TextField(
                      controller: latController,
                      decoration: const InputDecoration(labelText: 'Lat'),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                    ),
                    TextField(
                      controller: lngController,
                      decoration: const InputDecoration(labelText: 'Lng'),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                    ),
                    SwitchListTile(
                      value: isPrimary,
                      onChanged: (value) =>
                          setDialogState(() => isPrimary = value),
                      title: const Text('Primary'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () async {
                    await ref
                        .read(supplierServiceProvider)
                        .createLocation(
                          orgId: orgId,
                          supplierId: supplierId,
                          request: SupplierLocationUpsertRequest(
                            name: nameController.text,
                            streetAddress: streetController.text,
                            city: cityController.text,
                            state: stateController.text,
                            zip: zipController.text,
                            lat: double.tryParse(latController.text),
                            lng: double.tryParse(lngController.text),
                            isPrimary: isPrimary,
                          ),
                        );

                    if (context.mounted) {
                      Navigator.of(context).pop();
                    }
                    ref.invalidate(supplierDetailProvider(supplierId));
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    nameController.dispose();
    streetController.dispose();
    cityController.dispose();
    stateController.dispose();
    zipController.dispose();
    latController.dispose();
    lngController.dispose();
  }
}
