import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class AppNotificationService extends BaseApiService {
  Future<bool> saveFCMToken(String fcmToken) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return false;
      }
      
      
      final headers = await getAuthHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/auth/update-fcm-token'),
        headers: headers,
        body: jsonEncode({'userId': user.id, 'fcmToken': fcmToken}),
      );
      
      final data = jsonDecode(response.body);
      
      if (data['success'] == true) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> sendTestNotification() async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/test'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> getNotifications() async {
    try {
      final user = await getSavedUser();

      if (user == null) {
        if (kDebugMode) {
          print('❌ getNotifications: User not logged in');
        }
        return {'success': false, 'message': 'User not logged in'};
      }

      final url = '$baseUrl/notifications?userId=${user.id}';
      if (kDebugMode) {
        print('📍 Fetching notifications from: $url');
      }
      
      // Get token for authorization
      final token = await getToken();
      if (token == null) {
        if (kDebugMode) {
          print('❌ getNotifications: No token found');
        }
        return {'success': false, 'message': 'No token found'};
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      final data = jsonDecode(response.body);

      if (kDebugMode) {
        print('📊 Notifications response: ${response.statusCode}');
        print('📦 Data: $data');
      }

      return data;
    } catch (e) {
      if (kDebugMode) {
        print('💥 Error in getNotifications: $e');
      }
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<void> markNotificationAsRead({
    String? notificationId,
    bool markAll = false,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) return;
      await http.put(
        Uri.parse('$baseUrl/notifications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': user.id,
          'notificationId': notificationId,
          'markAll': markAll,
        }),
      );
    } catch (e) {

    }
  }

  Future<Map<String, dynamic>> toggleNotifications(bool enabled) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      final response = await http.post(
        Uri.parse('$baseUrl/auth/toggle-notifications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id, 'enabled': enabled}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
