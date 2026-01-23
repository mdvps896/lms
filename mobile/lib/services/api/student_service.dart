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
      final data = await apiGet('/student/dashboard?userId=${user.id}');
      
      if (data is Map && data['success'] == true) {
        await saveCache('dashboard_${user.id}', data['data']);
        return data['data'];
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
      
      final data = await apiGet('/users/${savedUser.id}');
      
      if (data is Map && data['success'] == true) {
        final userMap = data['data'] as Map<String, dynamic>;
        userMap['profilePicture'] = getFullUrl(
          userMap['profilePicture'],
        );
        userMap['profileImage'] = getFullUrl(
          userMap['profileImage'],
        );

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
      
      final data = await apiGet('/student/my-courses?userId=${user.id}');
      
      if (data is Map && data['success'] == true) {
        final courses = List<Map<String, dynamic>>.from(data['courses']);
        for (var course in courses) {
          course['thumbnail'] = getFullUrl(course['thumbnail']);
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
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      
      final result = await apiPost('/auth/profile/update', {'userId': user.id, ...data});
      
      if (result['success'] == true) await refreshUserProfile();
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
