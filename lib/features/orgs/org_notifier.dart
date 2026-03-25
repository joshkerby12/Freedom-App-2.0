import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../auth/auth_notifier.dart';
import 'org_service.dart';

part 'org_notifier.g.dart';

@riverpod
class OrgNotifier extends _$OrgNotifier {
  @override
  Future<OrgMembership?> build() async {
    final authState = ref.watch(authProvider);
    final session = authState.session;

    if (session == null) {
      return null;
    }

    return ref.read(orgServiceProvider).getCurrentMembership(session.user.id);
  }

  Future<OrgMembership?> refreshCurrentOrg() async {
    final authState = ref.read(authProvider);
    final session = authState.session;

    if (session == null) {
      state = const AsyncData(null);
      return null;
    }

    state = const AsyncLoading();

    final membership = await AsyncValue.guard(
      () => ref.read(orgServiceProvider).getCurrentMembership(session.user.id),
    );

    state = membership;
    if (membership.hasValue) {
      return membership.value;
    }
    return null;
  }

  Future<OrgMembership?> createOrg(String companyName) async {
    state = const AsyncLoading();

    final result = await AsyncValue.guard(
      () => ref.read(orgServiceProvider).createOrg(companyName: companyName),
    );

    state = result;
    if (result.hasValue) {
      return result.value;
    }
    return null;
  }
}
