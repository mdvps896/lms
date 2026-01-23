import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'base_api_service.dart';

class SupportService extends BaseApiService {
  Future<List<Map<String, dynamic>>> getSupportMessages() async {
    try {
      final user = await getSavedUser();
      if (user == null) return [];
      
      final data = await apiGet('/support/messages?userId=${user.id}');
      
      if (data is Map && data['success'] == true) {
        return List<Map<String, dynamic>>.from(data['messages']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> sendSupportMessage({
    String? text,
    List<String>? images,
  }) async {
    try {
      final user = await getSavedUser();
      if (user == null) {
        return {'success': false, 'message': 'User not logged in'};
      }
      
      final result = await apiPost('/support/send', {
        'userId': user.id,
        'senderId': user.id,
        'text': text ?? '',
        'images': images ?? [],
        'isAdmin': false,
      });
      return result;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<String?> uploadImage(
    List<int> bytes,
    String fileName, {
    String folder = 'images',
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/storage/upload');
      final request = http.MultipartRequest('POST', uri);
      
      final authHeaders = await getAuthHeaders();
      authHeaders.forEach((key, value) {
        if (key != 'Content-Type') request.headers[key] = value;
      });

      // Standardize mime type based on extension
      String type = 'image';
      String subtype = 'jpeg';
      final ext = fileName.split('.').last.toLowerCase();
      if (ext == 'png') subtype = 'png';
      else if (ext == 'gif') subtype = 'gif';
      else if (ext == 'webp') subtype = 'webp';

      // Add file
      final multipartFile = http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
        contentType: MediaType(type, subtype),
      );
      request.files.add(multipartFile);
      
      // Add folder
      request.fields['folder'] = folder;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode != 200 && response.statusCode != 201) {
        return null;
      }

      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        // multipart upload returns the url in 'path' field based on route.js
        return data['path'] ?? data['url'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
