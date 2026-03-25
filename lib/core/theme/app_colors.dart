import 'package:flutter/material.dart';

/// Freedom Landscapes brand colors — sourced from freedomlandscapes.co
/// Do not substitute these values without director approval.
class AppColors {
  AppColors._();

  // Brand
  static const Color primary = Color(0xFF42AAE2); // Cyan-blue
  static const Color primaryDark = Color(0xFF243252); // Dark navy
  static const Color accentGreen = Color(0xFF0B3D2C); // Forest green

  // Light mode
  static const Color backgroundLight = Color(0xFFEDEDED);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceElevatedLight = Color(0xFFF5F5F5);
  static const Color dividerLight = Color(0xFFD8D8D8);
  static const Color textPrimaryLight = Color(0xFF023D52); // Dark teal
  static const Color textBodyLight = Color(0xFF2F2F2F); // Charcoal
  static const Color textSecondaryLight = Color(0xFF7E7E7E);
  static const Color textDisabledLight = Color(0xFFBDBDBD);

  // Dark mode
  static const Color backgroundDark = Color(0xFF0F1923);
  static const Color surfaceDark = Color(0xFF1A2535);
  static const Color surfaceElevatedDark = Color(0xFF243048);
  static const Color dividerDark = Color(0xFF2E3D52);
  static const Color primaryDarkMode = Color(0xFF5B7FBF); // Lightened navy
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textBodyDark = Color(0xFFE0E0E0);
  static const Color textSecondaryDark = Color(0xFF9E9E9E);
  static const Color textDisabledDark = Color(0xFF4A4A4A);

  // Status (shared — adjusted per mode in theme)
  static const Color error = Color(0xFFD32F2F);
  static const Color errorDark = Color(0xFFEF5350);
  static const Color warning = Color(0xFFF57C00);
  static const Color warningDark = Color(0xFFFFB74D);
  static const Color success = Color(0xFF0B3D2C);
  static const Color successDark = Color(0xFF66BB6A);

  // Always white on colored backgrounds
  static const Color textOnPrimary = Color(0xFFFFFFFF);
}
