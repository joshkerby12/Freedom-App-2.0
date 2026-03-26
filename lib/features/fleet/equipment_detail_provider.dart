import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'equipment_service.dart';
import 'models/fleet_models.dart';

part 'equipment_detail_provider.g.dart';

@riverpod
Future<EquipmentDetail?> equipmentDetail(Ref ref, String equipmentId) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return null;
  }

  return ref.read(equipmentServiceProvider).getEquipmentDetail(
    orgId: org.orgId,
    equipmentId: equipmentId,
  );
}
