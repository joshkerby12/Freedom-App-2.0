import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'equipment_service.dart';
import 'models/fleet_models.dart';

part 'equipment_list_provider.g.dart';

@riverpod
Future<List<Equipment>> equipmentList(
  Ref ref, {
  String search = '',
  String type = 'all',
  bool includeInactive = true,
  bool hasExpiryAlert = false,
  bool inactiveOnly = false,
}) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return const <Equipment>[];
  }

  return ref
      .read(equipmentServiceProvider)
      .listEquipment(
        orgId: org.orgId,
        search: search,
        type: type,
        includeInactive: includeInactive,
        hasExpiryAlert: hasExpiryAlert,
        inactiveOnly: inactiveOnly,
      );
}
