import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    fontFamily: 'DMSans',
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: AppColors.brownDark,
      primaryContainer: AppColors.brownMid,
      secondary: AppColors.greenDark,
      surface: AppColors.surfaceLight,
      error: AppColors.error,
      onPrimary: AppColors.textOnPrimary,
      onSurface: AppColors.textBodyLight,
      onError: AppColors.textOnPrimary,
    ),
    scaffoldBackgroundColor: AppColors.backgroundLight,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.brownDark,
      foregroundColor: AppColors.creamBase,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: AppTextStyles.sectionTitle,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surfaceLight,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.dividerLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.dividerLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.brownDark, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.greenDark,
        foregroundColor: AppColors.textOnPrimary,
        minimumSize: const Size(88, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(
          fontFamily: 'DMSans',
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.brownDark,
        minimumSize: const Size(88, 44),
        side: const BorderSide(color: AppColors.brownDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.dividerLight,
      thickness: 1,
      space: 1,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.brownDark,
      selectedItemColor: AppColors.creamBase,
      unselectedItemColor: AppColors.brownMid,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
  );

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    fontFamily: 'DMSans',
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.greenLight,
      primaryContainer: AppColors.brownMid,
      secondary: AppColors.brownMid,
      surface: AppColors.surfaceDark,
      error: AppColors.errorDark,
      onPrimary: AppColors.textOnAccentDark,
      onSurface: AppColors.textBodyDark,
      onError: AppColors.textOnPrimary,
    ),
    scaffoldBackgroundColor: AppColors.backgroundDark,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.nearBlack,
      foregroundColor: AppColors.creamBase,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: AppTextStyles.sectionTitle,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surfaceDark,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.dividerDark),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.dividerDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.dividerDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.greenLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.errorDark),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
      fillColor: AppColors.surfaceElevatedDark,
      filled: true,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.greenLight,
        foregroundColor: AppColors.textOnAccentDark,
        minimumSize: const Size(88, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(
          fontFamily: 'DMSans',
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.greenLight,
        minimumSize: const Size(88, 44),
        side: const BorderSide(color: AppColors.greenLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.dividerDark,
      thickness: 1,
      space: 1,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.nearBlack,
      selectedItemColor: AppColors.greenLight,
      unselectedItemColor: AppColors.brownMid,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
  );
}
