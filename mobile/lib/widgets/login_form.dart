import 'package:flutter/material.dart';
import '../utils/constants.dart';

class LoginForm extends StatefulWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController otpController;
  final bool isLoading;
  final bool requires2FA;
  final bool registrationEnabled;
  final VoidCallback onLogin;
  final VoidCallback onVerifyOTP;
  final VoidCallback onGoogleSignIn;
  final VoidCallback onNavigateToRegister;

  const LoginForm({
    super.key,
    required this.emailController,
    required this.passwordController,
    required this.otpController,
    required this.isLoading,
    required this.requires2FA,
    required this.registrationEnabled,
    required this.onLogin,
    required this.onVerifyOTP,
    required this.onGoogleSignIn,
    required this.onNavigateToRegister,
  });

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  bool _isPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!widget.requires2FA) ...[
          // Email Field
          _buildLightTextField(
            controller: widget.emailController,
            label: 'Email',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),

          // Password Field
          _buildLightTextField(
            controller: widget.passwordController,
            label: 'Password',
            icon: Icons.lock_outline,
            obscureText: !_isPasswordVisible,
            suffixIcon: IconButton(
              icon: Icon(
                _isPasswordVisible
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: Colors.grey[600],
              ),
              onPressed: () {
                setState(() {
                  _isPasswordVisible = !_isPasswordVisible;
                });
              },
            ),
          ),

          const SizedBox(height: 24),

          // Login Button
          _buildRedButton(
            onPressed: widget.isLoading ? null : widget.onLogin,
            isLoading: widget.isLoading,
            text: 'Sign in',
          ),
        ] else ...[
          // 2FA View
          const Text(
            'Verify Identity',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the code sent to ${widget.emailController.text}',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),

          // OTP Field
          _buildLightTextField(
            controller: widget.otpController,
            label: 'Enter OTP',
            icon: Icons.verified_user_outlined,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 24),

          // Verify Button
          _buildRedButton(
            onPressed: widget.isLoading ? null : widget.onVerifyOTP,
            isLoading: widget.isLoading,
            text: 'VERIFY',
          ),

          // Back to Login
          TextButton(
            onPressed: () {
              // This will be handled in parent
            },
            child: Text(
              'Back to Login',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLightTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    Widget? suffixIcon,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey[300]!,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: const TextStyle(
          fontWeight: FontWeight.w500,
          color: Color(0xFF2C3E50),
          fontSize: 15,
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
          ),
          prefixIcon: Icon(
            icon,
            color: Colors.grey[600],
            size: 20,
          ),
          suffixIcon: suffixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey[300]!,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(
              color: AppConstants.primaryColor,
              width: 2,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRedButton({
    required VoidCallback? onPressed,
    required bool isLoading,
    required String text,
  }) {
    return Container(
      height: 54,
      decoration: BoxDecoration(
        color: AppConstants.primaryColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppConstants.primaryColor.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
      ),
    );
  }
}
