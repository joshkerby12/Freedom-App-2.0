import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';

// TODO: Wire up GoRouter in Phase 1 (app_router.dart)
class FreedomApp extends ConsumerWidget {
  const FreedomApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeNotifierProvider);

    return MaterialApp(
      title: 'Freedom App',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      home: const Scaffold(
        body: Center(
          child: Text('Freedom App 2.0 — scaffold ready'),
        ),
      ),
    );
  }
}
