import 'dart:convert';
import 'package:http/http.dart' as http;
import 'base_api_service.dart';

class SupportService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getSupportMessages() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      final response = await http.get(Uri.parse('$baseUrl/support/messages?userId=${user.id}'));
      final data = jsonDecode(response.body);
      if (data['success'] == true) return List<Map<String, dynamic>>.from(data['messages']);
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> sendSupportMessage({String? text, List<String>? images}) async {
    try {
      final user = await getSavedUser();
      if (user == null) return {'success': false, 'message': 'User not logged in'};
      final response = await http.post(
        Uri.parse('$baseUrl/support/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': user.id,
          'senderId': user.id,
          'text': text ?? '',
          'images': images ?? [],
          'isAdmin': false,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<String?> uploadImage(List<int> bytes, String fileName) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/storage/simple-upload'),
        headers: {
          'x-filename': fileName,
          'x-folder': 'support_chats',
          'x-mime-type': 'image/${fileName.split('.').last}',
        },
        body: bytes,
      );
      final data = jsonDecode(response.body);
      if (data['success'] == true) return data['url'];
      return null;
    } catch (e) {
      return null;
    }
  }
}
