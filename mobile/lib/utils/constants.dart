import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'MD Consultancy';

  // Colors - Premium Palette
  static const Color primaryColor = Color(0xFF91C640); // User requested Green
  static const Color secondaryColor = Color(0xFF1C416D); // User requested Blue (Navigation)
  static const Color accentColor = Color(0xFF1C416D); // Using Blue as accent for now
  static const Color backgroundColor = Colors.white;
  static const Color surfaceColor = Colors.white;
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF757575);
  static const Color inputFillColor = Color(
    0xFFF5F5F5,
  ); // Light grey for inputs

  // Text Styles
  static const TextStyle headingStyle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    fontFamily: 'Roboto', // Default for now
  );

  static const TextStyle subHeadingStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static const TextStyle bodyStyle = TextStyle(
    fontSize: 14,
    color: textSecondary,
  );
}
