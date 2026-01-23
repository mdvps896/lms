import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import 'api/base_api_service.dart';
import 'api/auth_service.dart';
import 'api/course_service.dart';
import 'api/exam_service.dart';
import 'api/student_service.dart';
import 'api/payment_service.dart';
import 'api/support_service.dart';
import 'api/app_notification_service.dart';
import 'api/mobile_auth_service.dart';

class ApiService extends BaseApiService {


  final AuthService _auth = AuthService();
  final CourseService _courses = CourseService();
  final ExamService _exams = ExamService();
  final StudentService _student = StudentService();
  final PaymentService _payments = PaymentService();
  final SupportService _support = SupportService();
  final AppNotificationService _notifications = AppNotificationService();
  final MobileAuthService _mobileAuth = MobileAuthService();

  // --- Auth Delegation ---
  Future<Map<String, dynamic>> login(String email, String password) =>
      _auth.login(email, password);
  Future<Map<String, dynamic>> verify2FA(String userId, String otp) =>
      _auth.verify2FA(userId, otp);
  Future<bool> checkRegistrationEnabled() => _auth.checkRegistrationEnabled();
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String mobile,
    required String password,
  }) => _auth.register(
    name: name,
    email: email,
    mobile: mobile,
    password: password,
  );
  Future<Map<String, dynamic>> googleRegister({
    required String idToken,
    required String name,
    required String email,
    String? photoUrl,
  }) => _auth.googleRegister(
    idToken: idToken,
    name: name,
    email: email,
    photoUrl: photoUrl,
  );
  Future<Map<String, dynamic>> verifyRegistrationOtp({
    required String email,
    required String otp,
    required String name,
    required String mobile,
    required String password,
  }) => _auth.verifyRegistrationOtp(
    email: email,
    otp: otp,
    name: name,
    mobile: mobile,
    password: password,
  );
  Future<Map<String, dynamic>> resendRegistrationOtp({
    required String email,
    required String name,
  }) => _auth.resendRegistrationOtp(email: email, name: name);
  Future<Map<String, dynamic>> changePassword(
    String oldPassword,
    String newPassword,
  ) => _auth.changePassword(oldPassword, newPassword);

  // --- Mobile Auth Delegation ---
  Future<Map<String, dynamic>> getAppSettings() => _mobileAuth.getAppSettings();
  Future<Map<String, dynamic>> sendMobileOTP(String mobile) => 
      _mobileAuth.sendMobileOTP(mobile);
  Future<Map<String, dynamic>> verifyMobileOTP({
    required String mobile,
    required String otp,
    String? name,
    String? deviceId,
  }) => _mobileAuth.verifyMobileOTP(
    mobile: mobile,
    otp: otp,
    name: name,
    deviceId: deviceId,
  );


  Future<Map<String, dynamic>> toggle2FA(bool enabled) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      final response = await http.post(
        Uri.parse('$baseUrl/auth/toggle-2fa'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': user.id, 'enabled': enabled}),
      );
      final result = jsonDecode(response.body);
      if (result['success'] == true) await refreshUserProfile();
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // --- Course Delegation ---
  Future<List<Map<String, dynamic>>> getCourses() => _courses.getCourses();
  Future<List<Map<String, dynamic>>> getCategories() async =>
      _courses.getCategories();
  Future<Map<String, dynamic>?> getCourseById(String id, {String? userId}) =>
      _courses.getCourseById(id, userId: userId);
  Future<Map<String, dynamic>> rateCourse(
    String courseId,
    double rating,
    String review,
  ) => _courses.rateCourse(courseId, rating, review);
  Future<Map<String, dynamic>> toggleLike(String courseId) =>
      _courses.toggleLike(courseId);
  Future<void> updateCourseProgress(String courseId, String lectureId) =>
      _courses.updateCourseProgress(courseId, lectureId);
  // Meetings
  Future<List<Map<String, dynamic>>> getMeetings() async {
    try {
      final headers = await getAuthHeaders();
      final response = await http.get(Uri.parse('$baseUrl/meetings'), headers: headers);
      
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final list = List<Map<String, dynamic>>.from(data['data']);
        return list;
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
  }) => _courses.trackPdfView(
    action: action,
    courseId: courseId,
    lectureId: lectureId,
    sessionId: sessionId,
    lectureName: lectureName,
    pdfUrl: pdfUrl,
    pdfName: pdfName,
    currentPage: currentPage,
    totalPages: totalPages,
    latitude: latitude,
    longitude: longitude,
    locationName: locationName,
    activeDuration: activeDuration,
    pageDurations: pageDurations,
  );
  Future<Map<String, dynamic>> trackActivity({
    required String action,
    required String type,
    required String contentId,
    required String title,
    String? activityId,
    int? duration,
    int? activeDuration,
  }) => _courses.trackActivity(
    action: action,
    type: type,
    contentId: contentId,
    title: title,
    activityId: activityId,
    duration: duration,
    activeDuration: activeDuration,
  );

  // --- Exam Delegation ---
  Future<List<Map<String, dynamic>>> getExams({String? type}) =>
      _exams.getExams(type: type);
  Future<Map<String, dynamic>?> getExamById(String id) =>
      _exams.getExamById(id);
  Future<bool> submitExamAttempt({
    required String examId,
    required Map<String, dynamic> answers,
    required int score,
    required int totalMarks,
    required int timeTaken,
    required bool passed,
  }) => _exams.submitExamAttempt(
    examId: examId,
    answers: answers,
    score: score,
    totalMarks: totalMarks,
    timeTaken: timeTaken,
    passed: passed,
  );
  Future<List<Map<String, dynamic>>> getMyExamAttempts() =>
      _exams.getMyExamAttempts();

  // --- Student Delegation ---
  Future<Map<String, dynamic>> getDashboardData() =>
      _student.getDashboardData();
  Future<User?> refreshUserProfile() => _student.refreshUserProfile();
  Future<List<Map<String, dynamic>>> getMyCourses() => _student.getMyCourses();
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) =>
      _student.updateProfile(data);

  // --- Payment Delegation ---
  Future<List<Map<String, dynamic>>> getCoupons() => _payments.getCoupons();
  Future<Map<String, dynamic>> validateCoupon(String code, String courseId) =>
      _payments.validateCoupon(code, courseId);
  Future<Map<String, dynamic>> createOrder(double amount, String currency) =>
      _payments.createOrder(amount, currency);
  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> data) =>
      _payments.verifyPayment(data);
  Future<List<Map<String, dynamic>>> getMyPayments() =>
      _payments.getMyPayments();

  // --- Support Delegation ---
  Future<List<Map<String, dynamic>>> getSupportMessages() =>
      _support.getSupportMessages();
  Future<Map<String, dynamic>> sendSupportMessage({
    String? text,
    List<String>? images,
  }) => _support.sendSupportMessage(text: text, images: images);
  Future<String?> uploadImage(
    List<int> bytes,
    String fileName, {
    String folder = 'support_chats',
  }) => _support.uploadImage(bytes, fileName, folder: folder);

  // --- Notification Delegation ---
  Future<bool> saveFCMToken(String fcmToken) =>
      _notifications.saveFCMToken(fcmToken);
  Future<Map<String, dynamic>> sendTestNotification() =>
      _notifications.sendTestNotification();
  Future<Map<String, dynamic>> getNotifications() =>
      _notifications.getNotifications();
  Future<void> markNotificationAsRead({
    String? notificationId,
    bool markAll = false,
  }) => _notifications.markNotificationAsRead(
    notificationId: notificationId,
    markAll: markAll,
  );
  Future<Map<String, dynamic>> toggleNotifications(bool enabled) =>
      _notifications.toggleNotifications(enabled);

  // Free Materials
  Future<List<Map<String, dynamic>>> getFreeMaterials() async {
    try {
      final headers = await getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/free-materials'), 
        headers: headers
      );
      
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        final list = List<Map<String, dynamic>>.from(data['data']);
        return list;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Settings
  Future<Map<String, dynamic>?> getSettings() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/settings'));
      final data = jsonDecode(response.body);
      if (data['success'] == true) return data['data'];
      return null;
    } catch (e) {
      return null;
    }
  }

  // Session Check
  Future<Map<String, dynamic>> checkSession() => _auth.checkSession();

  // Selfie Upload Methods
  Future<Map<String, dynamic>> uploadEnrollmentSelfie({
    required File selfieFile,
    required String courseId,
    double? latitude,
    double? longitude,
    String? locationName,
  }) async {
    try {
      final headers = await getAuthHeaders();
      headers.remove('Content-Type'); // Remove for multipart

      final uri = Uri.parse('$baseUrl/student/selfies/upload');
      final request = http.MultipartRequest('POST', uri);
      
      // Add headers
      headers.forEach((key, value) {
        request.headers[key] = value;
      });

      // Add file
      request.files.add(
        await http.MultipartFile.fromPath(
          'selfie',
          selfieFile.path,
        ),
      );

      // Add metadata
      request.fields['courseId'] = courseId;
      request.fields['captureType'] = 'enrollment';
      if (latitude != null) request.fields['latitude'] = latitude.toString();
      if (longitude != null) request.fields['longitude'] = longitude.toString();
      if (locationName != null) request.fields['locationName'] = locationName;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Error uploading enrollment selfie: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> uploadPdfSelfie({
    required File selfieFile,
    required String sessionId,
    required String courseId,
    required String lectureId,
    required int currentPage,
    bool isInitial = false,
    double? latitude,
    double? longitude,
    String? locationName,
  }) async {
    try {
      final headers = await getAuthHeaders();
      headers.remove('Content-Type'); // Remove for multipart

      final uri = Uri.parse('$baseUrl/student/selfies/upload');
      final request = http.MultipartRequest('POST', uri);
      
      // Add headers
      headers.forEach((key, value) {
        request.headers[key] = value;
      });

      // Add file
      request.files.add(
        await http.MultipartFile.fromPath(
          'selfie',
          selfieFile.path,
        ),
      );

      // Add metadata
      request.fields['sessionId'] = sessionId;
      request.fields['courseId'] = courseId;
      request.fields['lectureId'] = lectureId;
      request.fields['currentPage'] = currentPage.toString();
      request.fields['captureType'] = isInitial ? 'pdf_initial' : 'pdf_periodic';
      if (latitude != null) request.fields['latitude'] = latitude.toString();
      if (longitude != null) request.fields['longitude'] = longitude.toString();
      if (locationName != null) request.fields['locationName'] = locationName;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Error uploading PDF selfie: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<List<Map<String, dynamic>>> getSessionSelfies(String sessionId) async {
    try {
      final headers = await getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/student/selfies/$sessionId'),
        headers: headers,
      );
      
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching session selfies: $e');
      return [];
    }
  }

  // Helper to clear user data (alias for logout)
  Future<void> clearUserData() => logout();
}
