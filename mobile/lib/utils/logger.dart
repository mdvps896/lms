import 'package:flutter/foundation.dart';

/// Centralized logging utility
/// Only logs in debug mode, disabled in production
class Logger {
  /// Log general information
  /// Only visible in debug mode
  static void log(String message, {String tag = 'APP'}) {
    if (kDebugMode) {
      debugPrint('[$tag]  $message');
    }
  }

  /// Log errors with optional error object
  /// Only visible in debug mode
  static void error(
    String message, {
    String tag = 'ERROR',
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (kDebugMode) {
      debugPrint('[$tag]  $message');
      if (error != null) debugPrint('Error:  $error');
      if (stackTrace != null) debugPrint('StackTrace:  $stackTrace');
    }
  }

  /// Log warnings
  /// Only visible in debug mode
  static void warning(String message, {String tag = 'WARNING'}) {
    if (kDebugMode) {
      debugPrint('[$tag]  $message');
    }
  }

  /// Log network requests (debug only)
  static void network(String message, {String tag = 'NETWORK'}) {
    if (kDebugMode) {
      debugPrint('[$tag]  $message');
    }
  }
}
