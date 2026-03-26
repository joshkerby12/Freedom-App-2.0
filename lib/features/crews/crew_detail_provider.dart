import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'crew_service.dart';
import 'models/crew.dart';

part 'crew_detail_provider.g.dart';

@riverpod
Future<CrewDetail?> crewDetail(Ref ref, String crewId) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return null;
  }

  return ref.read(crewServiceProvider).getCrewDetail(
    orgId: org.orgId,
    crewId: crewId,
  );
}

@riverpod
Future<List<Map<String, String>>> crewLeadOptions(Ref ref) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return const <Map<String, String>>[];
  }

  return ref.read(crewServiceProvider).listCrewLeadOptions(orgId: org.orgId);
}
