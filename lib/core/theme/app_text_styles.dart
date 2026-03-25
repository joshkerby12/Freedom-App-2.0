import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const TextStyle displayLarge = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle displayMedium = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimaryLight,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: FontWeight.w300,
    color: AppColors.textBodyLight,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: FontWeight.w300,
    color: AppColors.textBodyLight,
  );

  static const TextStyle label = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondaryLight,
  );

  static const TextStyle financial = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textBodyLight,
  );

  static const TextStyle chipLabel = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
  );
}
