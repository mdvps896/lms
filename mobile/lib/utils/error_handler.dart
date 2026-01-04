import 'dart:async';
import 'dart:io';

/// Centralized error handling utility
class ErrorHandler {
  /// Convert technical errors to user-friendly messages
  static String getUserFriendlyMessage(dynamic error) {
    if (error is TimeoutException) {
      return 'Request timed out. Please check your internet connection and try again.';
    }
    
    if (error is SocketException) {
      return 'No internet connection. Please check your network and try again.';
    }
    
    if (error is FormatException) {
      return 'Invalid data received from server. Please try again.';
    }
    
    if (error is HttpException) {
      return 'Server error occurred. Please try again later.';
    }
    
    // Generic error message for unknown errors
    return 'An unexpected error occurred. Please try again later.';
  }

  /// Log error for debugging (only in debug mode)
  static void logError(String context, dynamic error, [StackTrace? stackTrace]) {
    // In production, this would send to Firebase Crashlytics
    // For now, just use debug print
    if (error != null) {
      print('ERROR in $context: ${error.toString()}');
      if (stackTrace != null) {
        print('StackTrace: $stackTrace');
      }
    }
  }

  /// Handle API response errors
  static String handleApiError(int statusCode, String? message) {
    switch (statusCode) {
      case 400:
        return message ?? 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      case 404:
        return 'Requested resource not found.';
      case 429:
        return message ?? 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return message ?? 'An error occurred. Please try again.';
    }
  }
}
