import 'dart:convert';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class ExamService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getExams({String? type}) async {
    try {
      final url = type != null ? '$baseUrl/exams?type=$type' : '$baseUrl/exams';
      final response = await http.get(Uri.parse(url));
      final data = jsonDecode(response.body);
      if (data['success'] == true) return List<Map<String, dynamic>>.from(data['data']);
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getExamById(String id) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/exams/$id'));
      final data = jsonDecode(response.body);
      if (data['success'] == true) return data['data'];
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> submitExamAttempt({
    required String examId,
    required Map<int, dynamic> answers,
    required int score,
    required int totalMarks,
    required int timeTaken,
    required bool passed,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) return false;
      final response = await http.post(
        Uri.parse('$baseUrl/exam-attempts'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': user.id,
          'examId': examId,
          'answers': answers.map((key, value) => MapEntry(key.toString(), value)),
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
      final response = await http.get(Uri.parse('$baseUrl/exam-attempts?userId=${user.id}'));
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] is List) return List<Map<String, dynamic>>.from(data['data']);
      return [];
    } catch (e) {
      return [];
    }
  }
}
