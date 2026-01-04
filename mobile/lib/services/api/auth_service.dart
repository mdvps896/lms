import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';
import 'base_api_service.dart';

class AuthService extends BaseApiService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        if (data['success'] == true) {
          if (data['requiresTwoFactor'] == true) {
             return {
               'success': true,
               'requiresTwoFactor': true,
               'userId': data['userId'],
               'email': data['email']
             };
          }
          final user = User.fromJson(data['data']);
          await saveUser(user);
          return {'success': true, 'user': user};
        }
      }
      return {'success': false, 'message': data['message'] ?? 'Login failed'};
    } catch (e) {
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  Future<Map<String, dynamic>> verify2FA(String userId, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-2fa'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId, 'otp': otp}),
      );

      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final user = User.fromJson(data['data']);
        await saveUser(user);
        return {'success': true, 'user': user};
      }
      return {'success': false, 'message': data['message'] ?? 'Verification failed'};
    } catch (e) {
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  Future<bool> checkRegistrationEnabled() async {
    try {
      final url = '$baseUrl/auth/check-registration-enabled';
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['registrationEnabled'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String mobile,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'mobile': mobile,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        if (data['user'] != null) {
          final user = User.fromJson(data['user']);
          await saveUser(user);
        }
        final prefs = await SharedPreferences.getInstance();
        if (data['token'] != null) await prefs.setString('token', data['token']);
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> googleRegister({
    required String idToken,
    required String name,
    required String email,
    String? photoUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google-register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': idToken,
          'name': name,
          'email': email,
          'photoUrl': photoUrl,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        if (data['user'] != null) {
          final user = User.fromJson(data['user']);
          await saveUser(user);
        }
        final prefs = await SharedPreferences.getInstance();
        if (data['token'] != null) await prefs.setString('token', data['token']);
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> verifyRegistrationOtp({
    required String email,
    required String otp,
    required String name,
    required String mobile,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-registration-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'name': name,
          'mobile': mobile,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final user = User.fromJson(data['user']);
        await saveUser(user);
        final prefs = await SharedPreferences.getInstance();
        if (data['token'] != null) await prefs.setString('token', data['token']);
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> resendRegistrationOtp({
    required String email,
    required String name,
    String? mobile,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'name': name,
          'mobile': mobile ?? '',
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> changePassword(String oldPassword, String newPassword) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': user.id,
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
