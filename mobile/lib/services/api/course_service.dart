import 'dart:convert';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class CourseService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getCourses() async {
    final cached = await getCached('courses');
    try {
      final response = await http.get(Uri.parse('$baseUrl/courses')).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final courses = List<Map<String, dynamic>>.from(data['data']);
          for (var course in courses) {
            course['thumbnail'] = BaseApiService.getFullUrl(course['thumbnail']);
            if (course['instructor'] is Map) {
              course['instructor']['profileImage'] = BaseApiService.getFullUrl(course['instructor']['profileImage']);
              course['instructor']['profilePicture'] = BaseApiService.getFullUrl(course['instructor']['profilePicture']);
            }
          }
          await saveCache('courses', courses);
          return courses;
        }
      }
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    } catch (e) {
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    }
  }

  Future<List<Map<String, dynamic>>> getCategories() async {
    final cached = await getCached('categories');
    try {
      final response = await http.get(Uri.parse('$baseUrl/categories')).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          await saveCache('categories', data['data']);
          return List<Map<String, dynamic>>.from(data['data']);
        }
      }
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    } catch (e) {
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    }
  }

  Future<Map<String, dynamic>?> getCourseById(String id, {String? userId}) async {
    try {
      String url = '$baseUrl/courses/$id';
      if (userId != null) url += '?userId=$userId';
      final response = await http.get(Uri.parse(url), headers: {'Cache-Control': 'no-cache'});
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final course = data['data'] as Map<String, dynamic>;
        course['thumbnail'] = BaseApiService.getFullUrl(course['thumbnail']);
        if (course['instructor'] is Map) {
          course['instructor']['profileImage'] = BaseApiService.getFullUrl(course['instructor']['profileImage']);
          course['instructor']['profilePicture'] = BaseApiService.getFullUrl(course['instructor']['profilePicture']);
        }
        return course;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> rateCourse(String courseId, double rating, String review) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};
      final response = await http.post(
        Uri.parse('$baseUrl/courses/$courseId/rate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id, 'rating': rating, 'review': review}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> toggleLike(String courseId) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};
      final response = await http.post(
        Uri.parse('$baseUrl/courses/$courseId/like'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<void> updateCourseProgress(String courseId, String lectureId) async {
    try {
      final user = await getSavedUser();
      if (user == null) return;
      final response = await http.post(
        Uri.parse('$baseUrl/student/update-progress'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id, 'courseId': courseId, 'lectureId': lectureId}),
      );
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        // Option to refresh profile could be here but for separation we might handle it in UI or use a stream
      }
    } catch (e) {
      print('Update Progress Error: $e');
    }
  }
  
  Future<List<Map<String, dynamic>>> getFreeMaterials() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/free-materials'));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final materials = List<Map<String, dynamic>>.from(data['data']);
        for (var material in materials) {
          if (material['files'] != null) {
            for (var file in material['files']) {
              if (file['type'] != 'video' || (file['url'] != null && !file['url'].toString().contains('youtube.com'))) {
                file['url'] = BaseApiService.getFullUrl(file['url']);
              }
            }
          }
        }
        return materials;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getMeetings() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/meetings'));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
  Future<Map<String, dynamic>> trackPdfView({
    required String action,
    required String courseId,
    required String lectureId,
    String? sessionId,
    String? lectureName,
    String? pdfUrl,
    String? pdfName,
    int? currentPage,
    int? totalPages,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};

      final body = {
        'action': action,
        'userId': user.id,
        'courseId': courseId,
        'lectureId': lectureId,
      };

      if (sessionId != null) body['sessionId'] = sessionId;
      if (lectureName != null) body['lectureName'] = lectureName;
      if (pdfUrl != null) body['pdfUrl'] = pdfUrl;
      if (pdfName != null) body['pdfName'] = pdfName;
      if (currentPage != null) body['currentPage'] = currentPage;
      if (totalPages != null) body['totalPages'] = totalPages;

      final response = await http.post(
        Uri.parse('$baseUrl/courses/track-pdf-view'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      
      return jsonDecode(response.body);
    } catch (e) {
      print('PDF Tracking Error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}
