import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../../services/api/mobile_auth_service.dart';
import '../../services/firebase_phone_auth_service.dart';
import '../../utils/constants.dart';
import '../home_screen.dart';
import '../../widgets/auth/auth_header_carousel.dart';

class MobileOTPLoginScreen extends StatefulWidget {
  const MobileOTPLoginScreen({super.key});

  @override
  State<MobileOTPLoginScreen> createState() => _MobileOTPLoginScreenState();
}

class _MobileOTPLoginScreenState extends State<MobileOTPLoginScreen> {
  final _mobileController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();
  final _mobileAuthService = MobileAuthService();
  final _firebasePhoneAuth = FirebasePhoneAuthService();
  
  bool _isLoading = false;
  bool _otpSent = false;
  bool _isNewUser = false;
  int _resendTimer = 0;
  Timer? _timer;
  String? _verificationId;

  @override
  void dispose() {
    _mobileController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    setState(() => _resendTimer = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _sendOTP() async {
    final mobile = _mobileController.text.trim();
    if (mobile.isEmpty || mobile.length != 10) {
      _showError('Please enter a valid 10-digit mobile number');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final backendCheck = await _mobileAuthService.sendMobileOTP(mobile);
      if (backendCheck['success'] != true) {
        _showError(backendCheck['message'] ?? 'Failed to process request');
        setState(() => _isLoading = false);
        return;
      }

      setState(() {
        _isNewUser = backendCheck['isNewUser'] ?? false;
        _verificationId = backendCheck['sessionId']; // 2Factor Session ID
        _otpSent = true;
        _isLoading = false;
      });
      
      _startResendTimer();
      _showSuccess('OTP sent to $mobile via SMS');
      
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('Network error. Please try again.');
    }
  }

  Future<void> _verifyOTP() async {
    final mobile = _mobileController.text.trim();
    final otp = _otpController.text.trim();
    final name = _nameController.text.trim();

    if (otp.isEmpty || otp.length != 6) {
      _showError('Please enter a valid 6-digit OTP');
      return;
    }

    if (_isNewUser && name.isEmpty) {
      _showError('Please enter your name');
      return;
    }

    if (_verificationId == null) {
      _showError('Please request OTP first');
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Direct backend verification using 2Factor Session ID
      final result = await _mobileAuthService.verifyMobileOTP(
        mobile: mobile,
        otp: otp,
        name: _isNewUser ? name : null,
        sessionId: _verificationId,
      );

      if (result['success'] == true) {
        _showSuccess(result['message'] ?? 'Login successful');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
        }
      } else {
        _showError(result['message'] ?? 'Login failed');
      }
    } catch (e) {
      _showError('Network error. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  Future<void> _resendOTP() async {
     await _sendOTP();
  }

  @override
  Widget build(BuildContext context) {
    bool showBackButton = Navigator.canPop(context);

    // If keyboard is open, we might want to hide the carousel to show the form
    final isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top Section - Carousel (Hide if keyboard open to save space)
            if (!isKeyboardOpen)
              const Expanded(
                flex: 4,
                child: AuthHeaderCarousel(),
              )
            else
               const SizedBox(height: 20), // Small spacer if carousel hidden

            // Bottom Section - Form
            Expanded(
              flex: isKeyboardOpen ? 1 : 6, // Take mostly all space if keyboard open
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(30),
                    topRight: Radius.circular(30),
                  ),
                  boxShadow: [
                     BoxShadow(
                      color: Colors.black12,
                      blurRadius: 10,
                      offset: Offset(0, -5),
                    )
                  ],
                ),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 30),
                      
                      // Back Button & Title
                      Row(
                        children: [
                          if (showBackButton) 
                            InkWell(
                              onTap: () => Navigator.pop(context),
                              child: const Padding(
                                padding: EdgeInsets.only(right: 12.0),
                                child: Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.black),
                              ),
                            ),
                          Text(
                            _otpSent ? 'Verify OTP' : 'Login or signup',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 8),
                      Padding(
                        padding: EdgeInsets.only(left: showBackButton ? 32.0 : 0),
                        child: Text(
                          _otpSent 
                            ? 'Please enter the OTP sent to +91 ${_mobileController.text}' 
                            : 'Please enter your mobile number',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),

                      // Input Fields
                      if (!_otpSent) ...[
                        _buildPhoneInput(),
                      ] else ...[
                        _buildOTPInput(),
                        const SizedBox(height: 16),
                        _buildResendTimer(),
                        if (_isNewUser) ...[
                             const SizedBox(height: 16),
                             _buildNameInput(),
                        ],
                      ],

                      const SizedBox(height: 24),

                      // Action Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton.icon(
                          onPressed: _isLoading
                              ? null
                              : (_otpSent ? _verifyOTP : _sendOTP),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE0E0E0), // Default disabled look
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 0),
                          ).copyWith(
                             backgroundColor: MaterialStateProperty.resolveWith<Color>((states) {
                                if (states.contains(MaterialState.disabled)) {
                                  return Colors.grey[300]!;
                                }
                                return const Color(0xFF1E3A8A); // Active Blue
                             }),
                          ),
                          icon: _isLoading 
                              ? const SizedBox(
                                  width: 20, 
                                  height: 20, 
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
                                ) 
                              : const Icon(Icons.lock_outline, size: 18),
                          label: Text(
                            _otpSent 
                              ? (_isNewUser ? 'Register & Login' : 'Verify & Login') 
                              : 'Proceed Securely',
                             style: const TextStyle(
                               fontSize: 16,
                               fontWeight: FontWeight.w600,
                             ),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                       // Terms
                      if (!_otpSent)
                        Center(
                          child: Text(
                            'By continuing you agree to the Terms & Conditions',
                            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                          ),
                        ),

                      SizedBox(height: MediaQuery.of(context).viewInsets.bottom + 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          const Text(
            '+91',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 1,
            height: 24,
            color: Colors.grey[300],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: TextField(
              controller: _mobileController,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: const InputDecoration(
                hintText: 'Mobile Number',
                border: InputBorder.none,
                counterText: '',
                contentPadding: EdgeInsets.symmetric(vertical: 16),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 16, color: Colors.black87),
              onSubmitted: (_) => _sendOTP(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOTPInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF1E3A8A), width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _otpController,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 6,
        decoration: InputDecoration(
          hintText: '1 2 3 4 5 6',
          hintStyle: TextStyle(
            color: Colors.grey.withOpacity(0.3),
            letterSpacing: 12.0,
          ),
          border: InputBorder.none,
          counterText: '',
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 12.0),
        onSubmitted: (_) => _verifyOTP(),
      ),
    );
  }

  Widget _buildNameInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _nameController,
        keyboardType: TextInputType.name,
        decoration: const InputDecoration(
          hintText: 'Enter your name',
          border: InputBorder.none,
          icon: Icon(Icons.person_outline, color: Colors.grey),
          contentPadding: EdgeInsets.symmetric(vertical: 16),
        ),
        style: const TextStyle(fontSize: 16, color: Colors.black87),
      ),
    );
  }

  Widget _buildResendTimer() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        TextButton(
          onPressed: () {
            setState(() {
              _otpSent = false;
              _otpController.clear();
            });
          },
          child: const Text('Change Number', style: TextStyle(color: Colors.grey)),
        ),
        if (_resendTimer > 0)
          Text(
            'Resend in ${_resendTimer}s',
            style: const TextStyle(color: Colors.grey),
          )
        else
          TextButton(
            onPressed: _isLoading ? null : _resendOTP,
            child: const Text('Resend OTP'),
          ),
      ],
    );
  }
}
