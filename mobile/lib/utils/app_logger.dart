import 'package:flutter/foundation.dart';

/// 🔒 Secure Logger - Only logs in debug mode
/// Use this instead of print() to prevent logging in production
class AppLogger {
  static const bool _enableLogging = kDebugMode;

  /// Log info message
  static void info(String message, [String? tag]) {
    if (_enableLogging) {
      final prefix = tag != null ? '[$tag] ' : '';
      debugPrint('ℹ️ $prefix $message');
    }
  }

  /// Log error message
  static void error(String message, [dynamic error, StackTrace? stackTrace]) {
    if (_enableLogging) {
      debugPrint('❌ ERROR:  $message');
      if (error != null) {
        debugPrint('   Error:  $error');
      }
      if (stackTrace != null) {
        debugPrint('   StackTrace:  $stackTrace');
      }
    }
  }

  /// Log warning message
  static void warning(String message, [String? tag]) {
    if (_enableLogging) {
      final prefix = tag != null ? '[$tag] ' : '';
      debugPrint('⚠️ $prefix $message');
    }
  }

  /// Log success message
  static void success(String message, [String? tag]) {
    if (_enableLogging) {
      final prefix = tag != null ? '[$tag] ' : '';
      debugPrint('✅ $prefix $message');
    }
  }

  /// Log debug message (only in debug mode)
  static void debug(String message, [String? tag]) {
    if (_enableLogging) {
      final prefix = tag != null ? '[$tag] ' : '';
      debugPrint('🔍 $prefix $message');
    }
  }

  /// Log network request
  static void network(String method, String url, [int? statusCode]) {
    if (_enableLogging) {
      final status = statusCode != null ? ' [$statusCode]' : '';
      debugPrint('🌐 $method $url $status');
    }
  }

  /// Log security event
  static void security(String message) {
    if (_enableLogging) {
      debugPrint('🔒 SECURITY:  $message');
    }
  }
}
