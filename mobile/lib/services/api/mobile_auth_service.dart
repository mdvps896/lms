import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'base_api_service.dart';
import '../../models/user_model.dart';

class MobileAuthService extends BaseApiService {
  
  /// Get app-specific authentication settings
  Future<Map<String, dynamic>> getAppSettings() async {
    try {
      final url = '$baseUrl/auth/check-app-settings';
      debugPrint('🌐 Calling API: $url');
      
      final response = await http.get(
        Uri.parse(url),
      );

      debugPrint('📡 Response status: ${response.statusCode}');
      debugPrint('📡 Response body: ${response.body}');

      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        debugPrint('✅ API returned success with data: ${data['data']}');
        return data['data'];
      }
      
      debugPrint('⚠️ API returned success=false, using defaults');
      // Return default settings if API fails
      return {
        'enableRegistration': true,
        'enableMobileOTP': false,
        'allowEmailAuth': true,
        'allowGoogleAuth': true
      };
    } catch (e, stackTrace) {
      debugPrint('❌ Error fetching app settings: $e');
      debugPrint('❌ Stack trace: $stackTrace');
      // Return default settings on error
      return {
        'enableRegistration': true,
        'enableMobileOTP': false,
        'allowEmailAuth': true,
        'allowGoogleAuth': true
      };
    }
  }

  /// Send OTP to mobile number
  Future<Map<String, dynamic>> sendMobileOTP(String mobile) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/send-mobile-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mobile': mobile,
          'platform': 'app'
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Error sending mobile OTP: $e');
      return {'success': false, 'message': 'Failed to send OTP'};
    }
  }

  /// Verify OTP and login/register
  Future<Map<String, dynamic>> verifyMobileOTP({
    required String mobile,
    required String otp,
    String? name,
    String? deviceId,
    String? firebaseToken,
    String? sessionId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-mobile-login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (firebaseToken != null) 'firebaseToken': firebaseToken,
          'mobile': mobile,
          'otp': otp,
          if (sessionId != null) 'sessionId': sessionId,
          'name': name,
          'deviceId': deviceId,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        // Save user and token
        if (data['data'] != null) {
          final user = User.fromJson(data['data']);
          await saveUser(user);
        }
        if (data['token'] != null) {
          await saveToken(data['token']);
        }
      }

      return data;
    } catch (e) {
      debugPrint('Error verifying mobile OTP: $e');
      return {'success': false, 'message': 'Failed to verify OTP'};
    }
  }
}
