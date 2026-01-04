import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/user_model.dart';
import 'base_api_service.dart';

class StudentService extends BaseApiService {
  Future<Map<String, dynamic>> getDashboardData() async {
    final user = await getSavedUser();
    if (user == null) throw Exception('User not logged in');
    final cached = await getCached('dashboard_${user.id}');
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student/dashboard?userId=${user.id}'),
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          await saveCache('dashboard_${user.id}', data['data']);
          return data['data'];
        }
      }
      return cached ?? (throw Exception('Failed to load dashboard'));
    } catch (e) {
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<User?> refreshUserProfile() async {
    try {
      final savedUser = await getSavedUser();
      if (savedUser == null) return null;
      final response = await http.get(
        Uri.parse('$baseUrl/users/${savedUser.id}'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
         final userMap = data['data'] as Map<String, dynamic>;
         userMap['profilePicture'] = BaseApiService.getFullUrl(userMap['profilePicture']);
         userMap['profileImage'] = BaseApiService.getFullUrl(userMap['profileImage']);
         
         final newUser = User.fromJson(userMap);
         await saveUser(newUser);
         return newUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getMyCourses() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/student/my-courses?userId=${user.id}'), 
        headers: {'Cache-Control': 'no-cache'}
      ).timeout(const Duration(seconds: 10));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final courses = List<Map<String, dynamic>>.from(data['courses']);
        for (var course in courses) {
          course['thumbnail'] = BaseApiService.getFullUrl(course['thumbnail']);
        }
        return courses;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};
      final response = await http.post(
        Uri.parse('$baseUrl/auth/profile/update'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id, ...data}),
      ).timeout(const Duration(seconds: 10));
      final result = jsonDecode(response.body);
      if (result['success'] == true) await refreshUserProfile();
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
