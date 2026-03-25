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
}
