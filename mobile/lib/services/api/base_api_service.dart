import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../../utils/globals.dart';
import '../../screens/login_screen.dart';

abstract class BaseApiService {
  static bool _isLoggingOut = false;

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String get baseUrl => dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
  String get serverUrl => baseUrl.replaceAll('/api', '');

  String getFullUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;

    final baseUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
    final serverUrl = baseUrl.replaceAll('/api', '');

    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$serverUrl$cleanPath';
  }

  String getApiUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;

    String baseUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
    // Ensure baseUrl ends with /api
    if (!baseUrl.endsWith('/api')) {
      baseUrl = '$baseUrl/api';
    }

    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$baseUrl$cleanPath';
  }

  // --- Auth Headers ---
  Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // --- Storage Helpers ---
  Future<void> saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
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
    
    // Clear secure storage
    await _storage.delete(key: 'jwt_token');
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
  // --- Centralized API Methods ---
  
  Future<dynamic> apiGet(String path) async {
    try {
      final headers = await getAuthHeaders();
      final uri = Uri.parse(getApiUrl(path));

      
      final response = await http.get(uri, headers: headers)
          .timeout(const Duration(seconds: 15));
          
      return _handleResponse(response);
    } catch (e) {

      throw Exception('Network error: $e');
    }
  }

  Future<dynamic> apiPost(String path, dynamic body) async {
    try {
      final headers = await getAuthHeaders();
      final uri = Uri.parse(getApiUrl(path));

      
      final response = await http.post(
        uri, 
        headers: headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));
          
      return _handleResponse(response);
    } catch (e) {

      throw Exception('Network error: $e');
    }
  }

  dynamic _handleResponse(http.Response response) async {
    final body = response.body;
    dynamic data;
    try {
      data = jsonDecode(body);
    } catch (e) {
      data = {'message': body};
    }
    
    // Check for Unauthorized status or message
    // Check for Unauthorized status, specific messages, or HTML content (login page redirection)
    final msg = (data is Map) ? data['message']?.toString() : body;
    
    if (response.statusCode == 401 || 
        response.statusCode == 403 ||
        msg != null && (
          msg.contains('Unauthorized') ||
          msg.contains('Invalid token') ||
          msg.contains('/authentication/login') ||
          msg.contains('<!DOCTYPE html>') || 
          msg.contains('<html')
        )) {
      

      await _handleUnauthorized();
      throw Exception('Unauthorized');
    }

    return data;
  }

  Future<void> _handleUnauthorized() async {
    if (_isLoggingOut) return;
    _isLoggingOut = true;


    await logout();
    
    if (navigatorKey.currentState != null) {
      navigatorKey.currentState!.pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
      
      ScaffoldMessenger.of(navigatorKey.currentState!.context).showSnackBar(
        const SnackBar(
          content: Text('Session expired. Please login again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
    
    // Reset flag after delay
    Future.delayed(const Duration(seconds: 2), () {
      _isLoggingOut = false;
    });
  }
}
