import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;

import '../../core/network/supabase_client_provider.dart';

part 'auth_service.g.dart';

class AuthService {
  AuthService(this._client);

  final supa.SupabaseClient _client;

  Future<supa.AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
  }) {
    return _client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': fullName},
    );
  }

  Future<supa.AuthResponse> signIn({
    required String email,
    required String password,
  }) {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signOut() {
    return _client.auth.signOut();
  }

  Future<void> resetPassword(String email) {
    return _client.auth.resetPasswordForEmail(email);
  }

  supa.User? getCurrentUser() {
    return _client.auth.currentUser;
  }
}

@riverpod
AuthService authService(Ref ref) {
  final client = ref.watch(supabaseClientProvider);
  return AuthService(client);
}
