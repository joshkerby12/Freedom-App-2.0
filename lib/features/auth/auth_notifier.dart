import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;

import '../../core/network/supabase_client_provider.dart';
import 'auth_service.dart';

part 'auth_notifier.g.dart';

class AuthStateData {
  const AuthStateData({
    required this.isLoading,
    required this.session,
    this.errorMessage,
  });

  final bool isLoading;
  final supa.Session? session;
  final String? errorMessage;

  bool get isAuthenticated => session != null;

  AuthStateData copyWith({
    bool? isLoading,
    supa.Session? session,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthStateData(
      isLoading: isLoading ?? this.isLoading,
      session: session ?? this.session,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

@riverpod
class AuthNotifier extends _$AuthNotifier {
  StreamSubscription<supa.AuthState>? _authSubscription;

  @override
  AuthStateData build() {
    final client = ref.watch(supabaseClientProvider);
    final initialSession = client.auth.currentSession;

    _authSubscription = client.auth.onAuthStateChange.listen((event) {
      state = state.copyWith(
        isLoading: false,
        session: event.session,
        clearError: true,
      );
    });

    ref.onDispose(() async {
      await _authSubscription?.cancel();
    });

    return AuthStateData(isLoading: false, session: initialSession);
  }

  Future<String?> signUp({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await ref
          .read(authServiceProvider)
          .signUp(email: email, password: password, fullName: fullName);

      state = state.copyWith(
        isLoading: false,
        session: response.session ?? state.session,
        clearError: true,
      );

      return null;
    } on supa.AuthException catch (error) {
      final message = _friendlyAuthError(error.message);
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    } catch (_) {
      const message = 'Could not connect. Check your connection and try again';
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    }
  }

  Future<String?> signIn({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await ref
          .read(authServiceProvider)
          .signIn(email: email, password: password);

      state = state.copyWith(
        isLoading: false,
        session: response.session,
        clearError: true,
      );

      return null;
    } on supa.AuthException catch (error) {
      final message = _friendlyAuthError(error.message);
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    } catch (_) {
      const message = 'Could not connect. Check your connection and try again';
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    }
  }

  Future<String?> signOut() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await ref.read(authServiceProvider).signOut();
      state = const AuthStateData(isLoading: false, session: null);
      return null;
    } on supa.AuthException catch (error) {
      final message = _friendlyAuthError(error.message);
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    } catch (_) {
      const message = 'Could not connect. Check your connection and try again';
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    }
  }

  Future<String?> resetPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await ref.read(authServiceProvider).resetPassword(email);
      state = state.copyWith(isLoading: false, clearError: true);
      return null;
    } on supa.AuthException catch (error) {
      final message = _friendlyAuthError(error.message);
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    } catch (_) {
      const message = 'Could not connect. Check your connection and try again';
      state = state.copyWith(isLoading: false, errorMessage: message);
      return message;
    }
  }

  String _friendlyAuthError(String rawMessage) {
    final message = rawMessage.toLowerCase();

    if (message.contains('already registered') ||
        message.contains('already exists')) {
      return 'An account with this email already exists';
    }

    if (message.contains('invalid login credentials') ||
        message.contains('invalid credentials')) {
      return 'Email or password is incorrect';
    }

    if (message.contains('email not confirmed')) {
      return 'Please verify your email before signing in';
    }

    if (message.contains('network') ||
        message.contains('socket') ||
        message.contains('timeout')) {
      return 'Could not connect. Check your connection and try again';
    }

    return 'Something went wrong. Please try again.';
  }
}
