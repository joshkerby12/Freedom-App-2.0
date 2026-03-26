class AppRoutes {
  AppRoutes._();

  static const String signIn = '/auth/sign-in';
  static const String signUp = '/auth/sign-up';
  static const String resetPassword = '/auth/reset-password';
  static const String orgSetup = '/orgs/setup';

  static const String dashboard = '/dashboard';
  static const String clients = '/clients';
  static const String estimates = '/estimates';
  static const String schedule = '/schedule';
  static const String menu = '/menu';

  static const String employees = '/employees';
  static const String employeeNew = '/employees/new';
  static const String employeeDetail = '/employees/:id';
  static const String employeeEdit = '/employees/:id/edit';

  static const String roles = '/settings/roles';
  static const String roleDetail = '/settings/roles/:id';

  static const String inviteAccept = '/invite/accept';

  static const String catalogItems = '/catalog/items';
  static const String catalogItemCreate = '/catalog/items/new';
  static const String catalogSuppliers = '/catalog/suppliers';
  static const String catalogSupplierCreate = '/catalog/suppliers/new';
  static const String catalogPartners = '/catalog/partners';
  static const String catalogPriceReview = '/catalog/price-review';

  static const String catalogProducts = '/catalog/products';
  static const String catalogProductCreate = '/catalog/products/new';
  static const String catalogMaterialConfigs = '/catalog/material-configs';

  static const String crews = '/fleet/crews';
  static const String crewNew = '/fleet/crews/new';
  static const String crewDetail = '/fleet/crews/:id';
  static const String crewEdit = '/fleet/crews/:id/edit';

  static const String equipment = '/fleet/equipment';
  static const String equipmentNew = '/fleet/equipment/new';
  static const String equipmentDetail = '/fleet/equipment/:id';
  static const String equipmentEdit = '/fleet/equipment/:id/edit';
  static const String equipmentMaintenanceNew =
      '/fleet/equipment/:id/maintenance/new';
  static const String equipmentDvirNew = '/fleet/equipment/:id/dvir/new';
}
