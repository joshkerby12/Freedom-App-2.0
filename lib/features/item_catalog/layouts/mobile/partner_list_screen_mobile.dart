import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../orgs/org_notifier.dart';
import '../../item_catalog_queries.dart';
import '../../models/item_catalog_models.dart';
import '../../partner_service.dart';

class PartnerListScreenMobile extends ConsumerStatefulWidget {
  const PartnerListScreenMobile({super.key});

  @override
  ConsumerState<PartnerListScreenMobile> createState() =>
      _PartnerListScreenMobileState();
}

class _PartnerListScreenMobileState
    extends ConsumerState<PartnerListScreenMobile> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final partnersState = ref.watch(partnerListProvider(search: _search));

    return Scaffold(
      appBar: AppBar(title: const Text('Partners')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showPartnerDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Add Partner'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search partners',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _search = value.trim()),
            ),
          ),
          Expanded(
            child: partnersState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) =>
                  Center(child: Text('Failed to load partners: $error')),
              data: (partners) {
                if (partners.isEmpty) {
                  return const Center(child: Text('No partners yet'));
                }

                return ListView.separated(
                  itemCount: partners.length,
                  separatorBuilder: (_, _) => const Divider(height: 0),
                  itemBuilder: (context, index) {
                    final partner = partners[index];
                    return ListTile(
                      title: Text(partner.companyName),
                      subtitle: Text(
                        partner.tradeType ??
                            partner.contactName ??
                            'No details',
                      ),
                      trailing: partner.isActive
                          ? null
                          : const Chip(label: Text('Inactive')),
                      onTap: () => _showPartnerDialog(existingPartner: partner),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showPartnerDialog({Partner? existingPartner}) async {
    final orgMembership = await ref.read(orgProvider.future);
    final orgId = orgMembership?.orgId;
    if (orgId == null || !mounted) {
      return;
    }

    final companyController = TextEditingController(
      text: existingPartner?.companyName ?? '',
    );
    final contactController = TextEditingController(
      text: existingPartner?.contactName ?? '',
    );
    final phoneController = TextEditingController(
      text: existingPartner?.phone ?? '',
    );
    final emailController = TextEditingController(
      text: existingPartner?.email ?? '',
    );
    final tradeController = TextEditingController(
      text: existingPartner?.tradeType ?? '',
    );
    final notesController = TextEditingController(
      text: existingPartner?.notes ?? '',
    );

    bool isActive = existingPartner?.isActive ?? true;

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(
                existingPartner == null ? 'Add Partner' : 'Edit Partner',
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: companyController,
                      decoration: const InputDecoration(
                        labelText: 'Company Name',
                      ),
                    ),
                    TextField(
                      controller: contactController,
                      decoration: const InputDecoration(
                        labelText: 'Contact Name',
                      ),
                    ),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(labelText: 'Phone'),
                    ),
                    TextField(
                      controller: emailController,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                    TextField(
                      controller: tradeController,
                      decoration: const InputDecoration(
                        labelText: 'Trade Type',
                      ),
                    ),
                    TextField(
                      controller: notesController,
                      decoration: const InputDecoration(labelText: 'Notes'),
                    ),
                    SwitchListTile(
                      value: isActive,
                      onChanged: (value) =>
                          setDialogState(() => isActive = value),
                      title: const Text('Active'),
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
                    final request = PartnerUpsertRequest(
                      companyName: companyController.text,
                      contactName: contactController.text,
                      phone: phoneController.text,
                      email: emailController.text,
                      tradeType: tradeController.text,
                      notes: notesController.text,
                      isActive: isActive,
                    );

                    if (existingPartner == null) {
                      await ref
                          .read(partnerServiceProvider)
                          .createPartner(orgId: orgId, request: request);
                    } else {
                      await ref
                          .read(partnerServiceProvider)
                          .updatePartner(
                            orgId: orgId,
                            partnerId: existingPartner.id,
                            request: request,
                          );
                    }

                    if (context.mounted) {
                      Navigator.of(context).pop();
                    }
                    ref.invalidate(partnerListProvider());
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );

    companyController.dispose();
    contactController.dispose();
    phoneController.dispose();
    emailController.dispose();
    tradeController.dispose();
    notesController.dispose();
  }
}
