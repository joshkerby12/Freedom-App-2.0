import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/auth/auth_notifier.dart';
import '../../features/auth/auth_reset_password_screen.dart';
import '../../features/auth/auth_sign_in_screen.dart';
import '../../features/auth/auth_sign_up_screen.dart';
import '../../features/employees/employee_detail_screen.dart';
import '../../features/employees/employee_form_screen.dart';
import '../../features/employees/employee_list_screen.dart';
import '../../features/employees/invite_accept_screen.dart';
import '../../features/employees/role_detail_screen.dart';
import '../../features/employees/role_list_screen.dart';
import '../../features/item_catalog/layouts/mobile/item_catalog_detail_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/item_catalog_edit_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/item_catalog_list_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/partner_list_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/price_review_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/supplier_detail_screen_mobile.dart';
import '../../features/item_catalog/layouts/mobile/supplier_list_screen_mobile.dart';
import '../../features/orgs/org_setup_screen.dart';
import '../../features/product_catalog/layouts/mobile/material_config_edit_screen_mobile.dart';
import '../../features/product_catalog/layouts/mobile/product_catalog_detail_screen_mobile.dart';
import '../../features/product_catalog/layouts/mobile/product_catalog_edit_screen_mobile.dart';
import '../../features/product_catalog/layouts/mobile/product_catalog_list_screen_mobile.dart';
import 'app_routes.dart';
import 'router_notifier.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(Ref ref) {
  ref.watch(routerProvider);
  final routerNotifier = ref.read(routerProvider.notifier);

  return GoRouter(
    initialLocation: AppRoutes.dashboard,
    redirect: (context, state) => routerNotifier.redirect(state),
    routes: [
      GoRoute(
        path: AppRoutes.signIn,
        builder: (context, state) => const AuthSignInScreen(),
      ),
      GoRoute(
        path: AppRoutes.signUp,
        builder: (context, state) => const AuthSignUpScreen(),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        builder: (context, state) => const AuthResetPasswordScreen(),
      ),
      GoRoute(
        path: AppRoutes.orgSetup,
        builder: (context, state) => const OrgSetupScreen(),
      ),
      GoRoute(
        path: AppRoutes.inviteAccept,
        builder: (context, state) =>
            InviteAcceptScreen(token: state.uri.queryParameters['token'] ?? ''),
      ),
      ShellRoute(
        builder: (context, state, child) => _AppShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (context, state) =>
                const _ModulePlaceholder(title: 'Dashboard'),
          ),
          GoRoute(
            path: AppRoutes.clients,
            builder: (context, state) =>
                const _ModulePlaceholder(title: 'Clients'),
          ),
          GoRoute(
            path: AppRoutes.estimates,
            builder: (context, state) =>
                const _ModulePlaceholder(title: 'Estimates'),
          ),
          GoRoute(
            path: AppRoutes.schedule,
            builder: (context, state) =>
                const _ModulePlaceholder(title: 'Schedule'),
          ),
          GoRoute(
            path: AppRoutes.menu,
            builder: (context, state) => const _MenuScreen(),
          ),
          GoRoute(
            path: AppRoutes.employees,
            builder: (context, state) => const EmployeeListScreen(),
          ),
          GoRoute(
            path: AppRoutes.employeeNew,
            builder: (context, state) => const EmployeeFormScreen(),
          ),
          GoRoute(
            path: AppRoutes.employeeEdit,
            builder: (context, state) =>
                EmployeeFormScreen(employeeId: state.pathParameters['id']),
          ),
          GoRoute(
            path: AppRoutes.employeeDetail,
            builder: (context, state) => EmployeeDetailScreen(
              employeeId: state.pathParameters['id'] ?? '',
            ),
          ),
          GoRoute(
            path: AppRoutes.roles,
            builder: (context, state) => const RoleListScreen(),
          ),
          GoRoute(
            path: AppRoutes.roleDetail,
            builder: (context, state) =>
                RoleDetailScreen(roleId: state.pathParameters['id'] ?? ''),
          ),
          GoRoute(
            path: AppRoutes.catalogItems,
            builder: (context, state) => const ItemCatalogListScreenMobile(),
          ),
          GoRoute(
            path: AppRoutes.catalogItemCreate,
            builder: (context, state) => const ItemCatalogEditScreenMobile(),
          ),
          GoRoute(
            path: '${AppRoutes.catalogItems}/:itemId',
            builder: (context, state) => ItemCatalogDetailScreenMobile(
              itemId: state.pathParameters['itemId'] ?? '',
            ),
          ),
          GoRoute(
            path: '${AppRoutes.catalogItems}/:itemId/edit',
            builder: (context, state) => ItemCatalogEditScreenMobile(
              itemId: state.pathParameters['itemId'],
            ),
          ),
          GoRoute(
            path: AppRoutes.catalogPriceReview,
            builder: (context, state) => const PriceReviewScreenMobile(),
          ),
          GoRoute(
            path: AppRoutes.catalogSuppliers,
            builder: (context, state) => const SupplierListScreenMobile(),
          ),
          GoRoute(
            path: AppRoutes.catalogSupplierCreate,
            builder: (context, state) => const SupplierDetailScreenMobile(),
          ),
          GoRoute(
            path: '${AppRoutes.catalogSuppliers}/:supplierId',
            builder: (context, state) => SupplierDetailScreenMobile(
              supplierId: state.pathParameters['supplierId'],
            ),
          ),
          GoRoute(
            path: AppRoutes.catalogPartners,
            builder: (context, state) => const PartnerListScreenMobile(),
          ),
          GoRoute(
            path: AppRoutes.catalogProducts,
            builder: (context, state) => const ProductCatalogListScreenMobile(),
          ),
          GoRoute(
            path: AppRoutes.catalogProductCreate,
            builder: (context, state) => const ProductCatalogEditScreenMobile(),
          ),
          GoRoute(
            path: '${AppRoutes.catalogProducts}/:productId',
            builder: (context, state) => ProductCatalogDetailScreenMobile(
              productId: state.pathParameters['productId'] ?? '',
            ),
          ),
          GoRoute(
            path: '${AppRoutes.catalogProducts}/:productId/edit',
            builder: (context, state) => ProductCatalogEditScreenMobile(
              productId: state.pathParameters['productId'],
            ),
          ),
          GoRoute(
            path: AppRoutes.catalogMaterialConfigs,
            builder: (context, state) => const MaterialConfigEditScreenMobile(),
          ),
        ],
      ),
    ],
  );
}

class _AppShell extends StatelessWidget {
  const _AppShell({required this.child});

  final Widget child;

  static const List<String> _paths = [
    AppRoutes.dashboard,
    AppRoutes.clients,
    AppRoutes.estimates,
    AppRoutes.schedule,
    AppRoutes.menu,
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final selectedIndex = _selectedIndex(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Clients',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: 'Estimates',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today),
            label: 'Schedule',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu),
            selectedIcon: Icon(Icons.menu),
            label: 'Menu',
          ),
        ],
        onDestinationSelected: (index) {
          if (index == selectedIndex) {
            return;
          }
          context.go(_paths[index]);
        },
      ),
    );
  }

  int _selectedIndex(String location) {
    for (var i = 0; i < _paths.length; i++) {
      if (location.startsWith(_paths[i])) {
        return i;
      }
    }
    return 0;
  }
}

class _ModulePlaceholder extends StatelessWidget {
  const _ModulePlaceholder({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          const Text('Coming soon'),
        ],
      ),
    );
  }
}

class _MenuScreen extends ConsumerWidget {
  const _MenuScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Menu', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            const Text('Coming soon'),
            const SizedBox(height: 24),
            FilledButton.tonalIcon(
              onPressed: () => context.push(AppRoutes.employees),
              icon: const Icon(Icons.badge_outlined),
              label: const Text('Employees'),
            ),
            const SizedBox(height: 8),
            FilledButton.tonalIcon(
              onPressed: () => context.push(AppRoutes.roles),
              icon: const Icon(Icons.lock_outline),
              label: const Text('Roles & Permissions'),
            ),
            const SizedBox(height: 8),
            FilledButton.tonalIcon(
              onPressed: () => context.push(AppRoutes.catalogItems),
              icon: const Icon(Icons.inventory_2_outlined),
              label: const Text('Item Catalog'),
            ),
            const SizedBox(height: 8),
            FilledButton.tonalIcon(
              onPressed: () => context.push(AppRoutes.catalogProducts),
              icon: const Icon(Icons.widgets_outlined),
              label: const Text('Product Catalog'),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: authState.isLoading
                  ? null
                  : () async {
                      final router = GoRouter.of(context);
                      final messenger = ScaffoldMessenger.of(context);

                      final error = await ref
                          .read(authProvider.notifier)
                          .signOut();

                      if (!context.mounted) {
                        return;
                      }

                      if (error != null) {
                        messenger.showSnackBar(SnackBar(content: Text(error)));
                        return;
                      }

                      router.go(AppRoutes.signIn);
                    },
              child: const Text('Sign out'),
            ),
          ],
        ),
      ),
    );
  }
}
