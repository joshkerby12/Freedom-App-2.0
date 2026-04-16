import 'package:flutter/material.dart';

/// Ground Control Pro brand colors — see GCP-Brand-Colors.md
/// Do not substitute these values without director approval.
class AppColors {
  AppColors._();

  // ── Light mode ──────────────────────────────────────────────────────────────
  static const Color creamBase      = Color(0xFFF2E8D9); // Page background
  static const Color creamDeep      = Color(0xFFE6D5BE); // Cards, inputs, dividers
  static const Color brownDark      = Color(0xFF3D2B1F); // Nav bar, headings, primary buttons
  static const Color brownMid       = Color(0xFF6B4A35); // Secondary text, hover states
  static const Color greenDark      = Color(0xFF1E3A2F); // CTA buttons, tags, highlights

  // ── Dark mode ───────────────────────────────────────────────────────────────
  static const Color blackBase      = Color(0xFF0D0D0B); // Page background
  static const Color nearBlack      = Color(0xFF161612); // Cards, elevated surfaces
  // brownMid is shared — warm accent, borders, decorative elements
  static const Color greenLight     = Color(0xFF7AB87A); // CTA buttons, active nav, badges
  // creamBase is shared — body text and subtle UI in dark mode

  // ── Status (never theme-overridable) ────────────────────────────────────────
  static const Color error          = Color(0xFFD32F2F);
  static const Color errorDark      = Color(0xFFEF5350);
  static const Color warning        = Color(0xFFF57C00);
  static const Color warningDark    = Color(0xFFFFB74D);
  static const Color success        = Color(0xFF1E3A2F); // greenDark
  static const Color successDark    = Color(0xFF7AB87A); // greenLight

  // ── Convenience aliases ─────────────────────────────────────────────────────
  /// Light mode background
  static const Color backgroundLight       = creamBase;
  /// Light mode card / surface
  static const Color surfaceLight          = creamDeep;
  /// Light mode elevated surface
  static const Color surfaceElevatedLight  = Color(0xFFEFE3CF);
  /// Light mode divider
  static const Color dividerLight          = creamDeep;
  /// Light mode primary text
  static const Color textPrimaryLight      = brownDark;
  /// Light mode body text
  static const Color textBodyLight         = brownDark;
  /// Light mode secondary / muted text
  static const Color textSecondaryLight    = brownMid;
  /// Light mode disabled text
  static const Color textDisabledLight     = Color(0xFFB8A899);

  /// Dark mode background
  static const Color backgroundDark        = blackBase;
  /// Dark mode card / surface
  static const Color surfaceDark           = nearBlack;
  /// Dark mode elevated surface
  static const Color surfaceElevatedDark   = Color(0xFF1E1E1A);
  /// Dark mode divider
  static const Color dividerDark           = Color(0xFF252520);
  /// Dark mode primary text
  static const Color textPrimaryDark       = creamBase;
  /// Dark mode body text
  static const Color textBodyDark          = creamBase;
  /// Dark mode secondary / muted text
  static const Color textSecondaryDark     = brownMid;
  /// Dark mode disabled text
  static const Color textDisabledDark      = Color(0xFF4A4A46);

  /// Text on any primary-colored button / surface
  static const Color textOnPrimary         = creamBase;
  /// Text on green-light (dark mode CTA)
  static const Color textOnAccentDark      = blackBase;
}
