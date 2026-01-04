import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';

abstract class BaseApiService {
  String get baseUrl => dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
  String get serverUrl => baseUrl.replaceAll('/api', '');

  static String getFullUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    final baseUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
    final serverUrl = baseUrl.replaceAll('/api', '');
    
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$serverUrl$cleanPath';
  }

  // --- Storage Helpers ---
  Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  Future<User?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userData = prefs.getString('user_data');
    if (userData != null) {
      return User.fromJson(jsonDecode(userData));
    }
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    await prefs.remove('token');
    await prefs.remove('userId');
    await prefs.remove('userName');
    await prefs.remove('userEmail');
    await prefs.remove('userMobile');
  }

  // --- Cache Helpers ---
  Future<dynamic> getCached(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString('cache_$key');
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }

  Future<void> saveCache(String key, dynamic data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cache_$key', jsonEncode(data));
  }
}
