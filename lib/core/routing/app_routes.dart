class AppRoutes {
  AppRoutes._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String forgotPassword = '/auth/forgot-password';

  // Org
  static const String orgSetup = '/orgs/setup';

  // Main
  static const String dashboard = '/dashboard';

  // Clients
  static const String clients = '/clients';
  static const String clientDetail = '/clients/:id';
  static const String clientCreate = '/clients/new';

  // Estimates
  static const String estimates = '/estimates';
  static const String estimateDetail = '/estimates/:id';
  static const String estimateCreate = '/estimates/new';

  // Jobs
  static const String jobs = '/jobs';
  static const String jobDetail = '/jobs/:id';

  // Scheduling
  static const String schedule = '/schedule';

  // Employees
  static const String employees = '/employees';
  static const String employeeDetail = '/employees/:id';

  // Fleet
  static const String fleet = '/fleet';
  static const String equipmentDetail = '/fleet/:id';

  // Catalog
  static const String catalog = '/catalog';

  // EOS
  static const String eos = '/eos';
  static const String eosScorecard = '/eos/scorecard';
  static const String eosRocks = '/eos/rocks';
  static const String eosIssues = '/eos/issues';
  static const String eosMeeting = '/eos/meeting/:id';

  // Reports
  static const String reports = '/reports';

  // Settings
  static const String settings = '/settings';
}
