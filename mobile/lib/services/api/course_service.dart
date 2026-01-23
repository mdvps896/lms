import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class CourseService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getCourses() async {
    final cached = await getCached('courses');
    try {
      final data = await apiGet('/courses');
      
      if (data is Map && data['success'] == true) {
        final courses = List<Map<String, dynamic>>.from(data['data']);
        for (var course in courses) {
          course['thumbnail'] = getFullUrl(
            course['thumbnail'],
          );
          if (course['instructor'] is Map) {
            course['instructor']['profileImage'] = getFullUrl(
              course['instructor']['profileImage'],
            );
            course['instructor']['profilePicture'] =
                getFullUrl(
                  course['instructor']['profilePicture'],
                );
          }
        }
        await saveCache('courses', courses);
        return courses;
      }
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    } catch (e) {
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    }
  }

  Future<List<Map<String, dynamic>>> getCategories() async {
    final cached = await getCached('categories');
    try {
      final data = await apiGet('/categories');
      
      if (data is Map && data['success'] == true) {
        await saveCache('categories', data['data']);
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    } catch (e) {
      return cached != null ? List<Map<String, dynamic>>.from(cached) : [];
    }
  }

  Future<Map<String, dynamic>?> getCourseById(
    String id, {
    String? userId,
  }) async {
    try {
      String url = '/courses/$id';
      if (userId != null) url += '?userId=$userId';
      
      final data = await apiGet(url);
      
      if (data is Map && data['success'] == true) {
        final course = data['data'] as Map<String, dynamic>;
        course['thumbnail'] = getFullUrl(course['thumbnail']);
        if (course['instructor'] is Map) {
          course['instructor']['profileImage'] = getFullUrl(
            course['instructor']['profileImage'],
          );
          course['instructor']['profilePicture'] = getFullUrl(
            course['instructor']['profilePicture'],
          );
        }
        return course;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> rateCourse(
    String courseId,
    double rating,
    String review,
  ) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      
      final result = await apiPost('/courses/$courseId/rate', {
        'userId': user.id,
        'rating': rating,
        'review': review,
      });
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> toggleLike(String courseId) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      
      final result = await apiPost('/courses/$courseId/like', {'userId': user.id});
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<void> updateCourseProgress(String courseId, String lectureId) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        debugPrint('⚠️ Cannot update progress: User not logged in');
        return;
      }
      
      debugPrint('📝 Updating course progress:');
      debugPrint('  User: ${user.name} (${user.id})');
      debugPrint('  Course ID: $courseId');
      debugPrint('  Lecture ID: $lectureId');
      
      final result = await apiPost('/student/update-progress', {
        'userId': user.id,
        'courseId': courseId,
        'lectureId': lectureId,
      });
      
      if (result['success'] == true) {
        debugPrint('✅ Progress updated successfully');
        debugPrint('  Completed lectures: ${result['completedLectures']}');
      } else {
        debugPrint('❌ Progress update failed: ${result['message']}');
      }
    } catch (e) {
      debugPrint('❌ Error updating course progress: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getFreeMaterials() async {
    try {
      final data = await apiGet('/free-materials');
      
      if (data is Map && data['success'] == true) {
        final materials = List<Map<String, dynamic>>.from(data['data']);
        for (var material in materials) {
          if (material['files'] != null) {
            for (var file in material['files']) {
              // Add full URL for all files except YouTube videos
              if (file['url'] != null &&
                  !file['url'].toString().contains('youtube.com') &&
                  !file['url'].toString().contains('youtu.be')) {
                file['url'] = getFullUrl(file['url']);
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
      final data = await apiGet('/meetings');
      if (data is Map && data['success'] == true) {
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
    double? latitude,
    double? longitude,
    String? locationName,
    int? activeDuration,
    Map<int, int>? pageDurations,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }

      final Map<String, dynamic> body = {
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
      if (latitude != null) body['latitude'] = latitude;
      if (longitude != null) body['longitude'] = longitude;
      if (locationName != null) body['locationName'] = locationName;
      if (activeDuration != null) body['activeDuration'] = activeDuration;
      if (pageDurations != null) {
        // Convert integer keys to strings for JSON encoding
        body['pageDurations'] =
            pageDurations.map((key, value) => MapEntry(key.toString(), value));
      }

      final result = await apiPost('/courses/track-pdf-view', body);
      return result;
    } catch (e) {

      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> trackActivity({
    required String action, // 'start', 'end'
    required String type, // 'course_view'
    required String contentId, // courseId
    required String title,
    String? activityId,
    int? duration, // in seconds
    int? activeDuration, // in seconds (active engagement time)
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }

      final Map<String, dynamic> body = {
        'action': action,
        'userId': user.id,
        'type': type,
        'contentId': contentId,
        'title': title,
      };

      if (activityId != null) body['activityId'] = activityId;
      if (duration != null) body['duration'] = duration;
      if (activeDuration != null) body['activeDuration'] = activeDuration;

      final result = await apiPost('/activity/track', body);
      return result;
    } catch (e) {

      return {'success': false, 'message': e.toString()};
    }
  }
}
