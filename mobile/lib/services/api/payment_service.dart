import 'dart:convert';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class PaymentService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getCoupons() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/coupons?format=mobile')).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> validateCoupon(String code, String courseId) async {
    try {
      final user = await getSavedUser();
      final response = await http.post(
        Uri.parse('$baseUrl/coupons/validate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'code': code, 'courseId': courseId, 'userId': user?.id}),
      ).timeout(const Duration(seconds: 10));
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  Future<Map<String, dynamic>> createOrder(double amount, String currency) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payment/create-order'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'amount': amount, 'currency': currency}),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Network error connection to payment gateway'};
    }
  }

  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payment/verify-payment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': 'Network error verifying payment'};
    }
  }

  Future<List<Map<String, dynamic>>> getMyPayments() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      final response = await http.get(Uri.parse('$baseUrl/student/payments?userId=${user.id}')).timeout(const Duration(seconds: 10));
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final payments = List<Map<String, dynamic>>.from(data['data']);
        for (var payment in payments) {
          payment['courseThumbnail'] = BaseApiService.getFullUrl(payment['courseThumbnail']);
        }
        return payments;
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
