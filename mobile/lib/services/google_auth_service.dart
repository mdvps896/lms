import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        return {'success': false, 'message': 'Google Sign-In cancelled'};
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Send the info to our backend
      final response = await _apiService.googleRegister(
        idToken: googleAuth.idToken ?? '',
        name: googleUser.displayName ?? '',
        email: googleUser.email,
        photoUrl: googleUser.photoUrl,
      );

      return response;
    } catch (error) {

      return {'success': false, 'message': 'Error: ${error.toString()}'};
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }
}
