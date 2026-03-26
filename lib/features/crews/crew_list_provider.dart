import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../orgs/org_notifier.dart';
import 'crew_service.dart';
import 'models/crew.dart';

part 'crew_list_provider.g.dart';

@riverpod
Future<List<CrewSummary>> crewList(Ref ref) async {
  final org = await ref.watch(orgProvider.future);
  if (org == null) {
    return const <CrewSummary>[];
  }

  return ref.read(crewServiceProvider).listCrews(orgId: org.orgId);
}
