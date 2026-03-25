import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  AppConstants._();

  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? '';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  static String get anthropicApiKey => dotenv.env['ANTHROPIC_API_KEY'] ?? '';
  static String get deepgramApiKey => dotenv.env['DEEPGRAM_API_KEY'] ?? '';
  static String get plaidClientId => dotenv.env['PLAID_CLIENT_ID'] ?? '';
  static String get plaidSecret => dotenv.env['PLAID_SECRET'] ?? '';
  static String get plaidEnv => dotenv.env['PLAID_ENV'] ?? 'sandbox';
}
