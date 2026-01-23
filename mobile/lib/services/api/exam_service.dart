import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class ExamService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getExams({String? type}) async {
    try {
      final url = type != null ? '$baseUrl/exams?type=$type' : '$baseUrl/exams';
      final response = await http.get(Uri.parse(url));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getExamById(String id) async {
    try {
      final headers = await getAuthHeaders();
      final url = '$baseUrl/exams/$id';

      if (kDebugMode) {
        print('🔍 Fetching exam details...');
        print('📍 URL: $url');
        print('🔑 Headers: ${headers.keys.join(", ")}');
      }

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      if (kDebugMode) {
        print('📊 Response Status: ${response.statusCode}');
        print('📦 Response Body Length: ${response.body.length} bytes');
      }

      if (response.statusCode != 200) {
        if (kDebugMode) {
          print('❌ HTTP Error ${response.statusCode}');
          print('📄 Response: ${response.body}');
        }
        return null;
      }

      final data = jsonDecode(response.body);

      if (kDebugMode) {
        print('✅ Response decoded successfully');
        print('🎯 Success: ${data['success']}');
      }

      if (data['success'] == true) {
        if (kDebugMode) {
          print('✨ Exam data retrieved successfully');
        }
        return data['data'];
      }

      if (kDebugMode) {
        print('⚠️ API returned success=false');
        print('📄 Message: ${data['message'] ?? 'No message'}');
      }

      return null;
    } catch (e, stackTrace) {
      if (kDebugMode) {
        print('💥 Exception in getExamById:');
        print('❌ Error: $e');
        print('📚 Stack trace: $stackTrace');
      }
      return null;
    }
  }


  Future<bool> submitExamAttempt({
    required String examId,
    required Map<String, dynamic> answers,
    required int score,
    required int totalMarks,
    required int timeTaken,
    required bool passed,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) return false;
      final headers = await getAuthHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/exam-attempts'),
        headers: headers,
        body: jsonEncode({
          'userId': user.id,
          'examId': examId,
          'answers': answers,
          'score': score,
          'totalMarks': totalMarks,
          'timeTaken': timeTaken,
          'passed': passed,
          'status': 'submitted',
        }),
      );
      final data = jsonDecode(response.body);
      return data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getMyExamAttempts() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      final headers = await getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/exam-attempts?userId=${user.id}'),
        headers: headers,
      );
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] is List) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
