import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class FirebasePhoneAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  String? _verificationId;
  int? _resendToken;

  /// Send OTP to phone number
  /// Returns true if OTP was sent successfully
  Future<Map<String, dynamic>> sendOTP({
    required String phoneNumber,
    required Function(String verificationId) onCodeSent,
    required Function(String error) onError,
  }) async {
    try {
      debugPrint('🔥 Firebase: Sending OTP to $phoneNumber');
      
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        
        // Called when verification is completed automatically (Android only)
        verificationCompleted: (PhoneAuthCredential credential) async {
          debugPrint('🔥 Firebase: Auto-verification completed');
          // This happens on Android when SMS is auto-detected
          // We'll handle this in the UI
        },
        
        // Called when verification fails
        verificationFailed: (FirebaseAuthException e) {
          debugPrint('🔥 Firebase: Verification failed - ${e.code}: ${e.message}');
          String errorMessage = 'Failed to send OTP';
          
          if (e.code == 'invalid-phone-number') {
            errorMessage = 'Invalid phone number format';
          } else if (e.code == 'too-many-requests') {
            errorMessage = 'Too many requests. Please try again later';
          } else if (e.code == 'quota-exceeded') {
            errorMessage = 'SMS quota exceeded. Please try again later';
          }
          
          onError(errorMessage);
        },
        
        // Called when OTP is sent
        codeSent: (String verificationId, int? resendToken) {
          debugPrint('🔥 Firebase: OTP sent successfully');
          _verificationId = verificationId;
          _resendToken = resendToken;
          onCodeSent(verificationId);
        },
        
        // Called when auto-retrieval timeout
        codeAutoRetrievalTimeout: (String verificationId) {
          debugPrint('🔥 Firebase: Auto-retrieval timeout');
          _verificationId = verificationId;
        },
        
        // Use resend token for resending OTP
        forceResendingToken: _resendToken,
      );
      
      return {'success': true};
    } catch (e) {
      debugPrint('🔥 Firebase: Error sending OTP - $e');
      onError('Failed to send OTP: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Verify OTP and get Firebase ID token
  Future<Map<String, dynamic>> verifyOTP({
    required String verificationId,
    required String otp,
  }) async {
    try {
      debugPrint('🔥 Firebase: Verifying OTP');
      
      // Create credential
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: otp,
      );

      // Sign in with credential
      UserCredential userCredential = await _auth.signInWithCredential(credential);
      
      // Get ID token
      String? idToken = await userCredential.user?.getIdToken();
      
      if (idToken == null) {
        return {
          'success': false,
          'message': 'Failed to get authentication token'
        };
      }

      debugPrint('🔥 Firebase: OTP verified successfully');
      
      return {
        'success': true,
        'idToken': idToken,
        'phoneNumber': userCredential.user?.phoneNumber,
        'uid': userCredential.user?.uid,
      };
    } on FirebaseAuthException catch (e) {
      debugPrint('🔥 Firebase: Verification error - ${e.code}: ${e.message}');
      
      String errorMessage = 'Invalid OTP';
      if (e.code == 'invalid-verification-code') {
        errorMessage = 'Invalid OTP code';
      } else if (e.code == 'session-expired') {
        errorMessage = 'OTP expired. Please request a new one';
      }
      
      return {
        'success': false,
        'message': errorMessage
      };
    } catch (e) {
      debugPrint('🔥 Firebase: Error verifying OTP - $e');
      return {
        'success': false,
        'message': 'Failed to verify OTP'
      };
    }
  }

  /// Sign out from Firebase
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
