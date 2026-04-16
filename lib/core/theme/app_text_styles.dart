import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const TextStyle displayLarge = TextStyle(
    fontFamily: 'DMSerifDisplay',
    fontSize: 32,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle displayMedium = TextStyle(
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 16,
    fontWeight: FontWeight.w300,
    color: AppColors.textBodyLight,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: FontWeight.w300,
    color: AppColors.textBodyLight,
  );

  static const TextStyle label = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondaryLight,
  );

  static const TextStyle financial = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textBodyLight,
  );

  static const TextStyle chipLabel = TextStyle(
    fontFamily: 'DMMono',
    fontSize: 11,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
  );

  static const TextStyle monoTag = TextStyle(
    fontFamily: 'DMMono',
    fontSize: 10,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.8,
  );
}
