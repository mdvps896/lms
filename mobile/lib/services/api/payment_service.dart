import 'dart:convert';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class PaymentService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getCoupons() async {
    try {
      final data = await apiGet('/coupons?format=mobile');
      if (data is Map && data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> validateCoupon(
    String code,
    String courseId,
  ) async {
    try {
      final user = await getSavedUser();
      
      final result = await apiPost('/coupons/validate', {
        'code': code,
        'courseId': courseId,
        'userId': user?.id,
      });
      return result;
    } catch (e) {
      // Return a map so the UI can show the error (since exception might be 'Unauthorized')
      return {'success': false, 'message': 'Validation failed: ${e.toString()}'};
    }
  }

  Future<Map<String, dynamic>> createOrder(
    double amount,
    String currency,
  ) async {
    try {
      final result = await apiPost('/payment/create-order', {
        'amount': amount,
        'currency': currency,
      });
      return result;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error creating order: $e',
      };
    }
  }

  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> data) async {
    try {
      final result = await apiPost('/payment/verify-payment', data);
      return result;
    } catch (e) {
      return {'success': false, 'message': 'Error verifying payment: $e'};
    }
  }

  Future<List<Map<String, dynamic>>> getMyPayments() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      
      final data = await apiGet('/student/payments?userId=${user.id}');
      
      if (data is Map && data['success'] == true) {
        final payments = List<Map<String, dynamic>>.from(data['data']);
        for (var payment in payments) {
          payment['courseThumbnail'] = getFullUrl(
            payment['courseThumbnail'],
          );
        }
        return payments;
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
