import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'equipment_list_provider.dart';

part 'fleet_home_provider.g.dart';

@riverpod
Future<int> fleetEquipmentCount(Ref ref) async {
  final equipment = await ref.watch(equipmentListProvider().future);
  return equipment.length;
}
