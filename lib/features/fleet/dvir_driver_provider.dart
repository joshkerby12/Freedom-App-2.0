import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'equipment_service.dart';

part 'dvir_driver_provider.g.dart';

@riverpod
Future<List<Map<String, String>>> dvirDriverOptions(Ref ref) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return const <Map<String, String>>[];
  }

  return ref.read(dvirServiceProvider).listDriverOptions(orgId: org.orgId);
}
