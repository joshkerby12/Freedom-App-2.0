import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/auth/auth_notifier.dart';
import '../../features/orgs/org_notifier.dart';
import 'app_routes.dart';

part 'router_notifier.g.dart';

class RouterStateSnapshot {
  const RouterStateSnapshot({
    required this.isAuthLoading,
    required this.isOrgLoading,
    required this.isAuthenticated,
    required this.hasOrg,
  });

  final bool isAuthLoading;
  final bool isOrgLoading;
  final bool isAuthenticated;
  final bool hasOrg;

  bool get isLoading => isAuthLoading || isOrgLoading;
}

@riverpod
class RouterNotifier extends _$RouterNotifier {
  @override
  RouterStateSnapshot build() {
    final authState = ref.watch(authProvider);
    final orgState = ref.watch(orgProvider);

    final isAuthenticated = authState.session != null;
    final isOrgLoading = isAuthenticated && orgState.isLoading;
    final hasOrg = orgState.hasValue && orgState.value != null;

    return RouterStateSnapshot(
      isAuthLoading: authState.isLoading,
      isOrgLoading: isOrgLoading,
      isAuthenticated: isAuthenticated,
      hasOrg: hasOrg,
    );
  }

  String? redirect(GoRouterState state) {
    final snapshot = this.state;
    final location = state.matchedLocation;

    final isAuthRoute =
        location == AppRoutes.signIn ||
        location == AppRoutes.signUp ||
        location == AppRoutes.resetPassword ||
        location == AppRoutes.inviteAccept;

    if (snapshot.isLoading) {
      return null;
    }

    if (!snapshot.isAuthenticated) {
      return isAuthRoute ? null : AppRoutes.signIn;
    }

    if (!snapshot.hasOrg) {
      return location == AppRoutes.orgSetup ? null : AppRoutes.orgSetup;
    }

    if (isAuthRoute || location == AppRoutes.orgSetup) {
      return AppRoutes.dashboard;
    }

    return null;
  }
}
