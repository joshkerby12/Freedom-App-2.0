import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'crew_list_provider.dart';

part 'crews_home_provider.g.dart';

@riverpod
Future<int> crewCount(Ref ref) async {
  final crews = await ref.watch(crewListProvider.future);
  return crews.length;
}
