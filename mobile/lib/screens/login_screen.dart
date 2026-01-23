import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../services/api_service.dart';
import '../services/google_auth_service.dart';
import '../services/firebase_notification_service.dart';
import '../widgets/login_form.dart';
import 'home_screen.dart';
import 'admin/admin_main_screen.dart';
import 'register/register_screen.dart';
import 'register/otp_verification_screen.dart';
import 'auth/mobile_otp_login_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();
  final _apiService = ApiService();
  final _googleAuthService = GoogleAuthService();
  
  bool _isLoading = false;
  bool _requires2FA = false;
  String? _pendingUserId;
  bool _registrationEnabled = false;
  
  // App Settings
  bool _enableMobileOTP = false;
  bool _allowEmailAuth = true;
  bool _allowGoogleAuth = true;
  bool _appSettingsLoaded = false;

  // Animation Controller
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _checkRegistrationEnabled();
    _loadAppSettings();

    // Initialize Animation
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    _animationController.forward();
  }

  Future<void> _loadAppSettings() async {
    try {
      final settings = await _apiService.getAppSettings();
      debugPrint('📱 Received app settings: $settings');
      if (mounted) {
        setState(() {
          _enableMobileOTP = settings['enableMobileOTP'] ?? false;
          _allowEmailAuth = settings['allowEmailAuth'] ?? true;
          _allowGoogleAuth = settings['allowGoogleAuth'] ?? true;
          _appSettingsLoaded = true;
        });
        debugPrint('📱 Applied settings - MobileOTP: $_enableMobileOTP, Email: $_allowEmailAuth, Google: $_allowGoogleAuth');
        
        // Auto-navigate to mobile OTP screen if it's the ONLY enabled method
        if (_enableMobileOTP && !_allowEmailAuth && !_allowGoogleAuth) {
          debugPrint('🚀 Only mobile OTP enabled, auto-navigating to mobile OTP screen');
          // Use addPostFrameCallback to ensure Navigator is ready
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => const MobileOTPLoginScreen(),
                ),
              );
            }
          });
        }
      }
    } catch (e) {
      debugPrint('❌ Error loading app settings: $e');
      // Use defaults on error
      if (mounted) {
        setState(() {
          _appSettingsLoaded = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _checkRegistrationEnabled() async {
    final enabled = await _apiService.checkRegistrationEnabled();
    if (mounted) {
      setState(() {
        _registrationEnabled = enabled;
      });
    }
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      _showSnackBar('Please enter email and password');
      setState(() => _isLoading = false);
      return;
    }

    final result = await _apiService.login(email, password);
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      if (result['requiresTwoFactor'] == true) {
        setState(() {
          _requires2FA = true;
          _pendingUserId = result['userId'];
        });
        _showSnackBar('Verification code sent to your email');
      } else {
        await _saveFCMToken();
        _navigateToHome();
      }
    } else {
      if (result['emailNotVerified'] == true) {
        _showSnackBar(result['message'] ?? 'Please verify your email');
        _navigateToOTPVerification(result['email']);
      } else {
        _showSnackBar(result['message'] ?? 'Login failed');
      }
    }
  }

  Future<void> _handleVerifyOTP() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty || _pendingUserId == null) {
      _showSnackBar('Please enter the OTP');
      return;
    }

    setState(() => _isLoading = true);
    final result = await _apiService.verify2FA(_pendingUserId!, otp);
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      await _saveFCMToken();
      _navigateToHome();
    } else {
      _showSnackBar(result['message'] ?? 'Verification failed');
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    final result = await _googleAuthService.signInWithGoogle();
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      _navigateToHome();
    } else {
      _showSnackBar(result['message'] ?? 'Google Sign-In failed');
    }
  }

  Future<void> _saveFCMToken() async {
    try {
      final token = await FirebaseNotificationService.getFCMToken();
      if (token != null) {
        await _apiService.saveFCMToken(token);
      }
    } catch (e) {
    }
  }

  Future<void> _navigateToHome() async {
    if (mounted) {
      // Get the logged-in user to check their role
      final user = await _apiService.getSavedUser();
      
      if (user != null && user.role == 'admin') {
        // Navigate to admin interface
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const AdminMainScreen()),
        );
      } else {
        // Navigate to student home screen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      }
    }
  }

  void _navigateToOTPVerification(String email) {
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => OtpVerificationScreen(
            email: email,
            name: '',
            mobile: '',
            password: _passwordController.text,
          ),
        ),
      );
    }
  }

  void _showSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: const Color(0xFF2A2A3E),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  bool _isPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    // Define Colors based on the image
    const Color topBackgroundColor = Color(0xFFB1C9EF); // Soft Periwinkle Blue
    const Color buttonColor = Color(0xFF4460F1); // Royal Blue

    return Scaffold(
      backgroundColor: topBackgroundColor,
      body: Stack(
        children: [
          // 1. Logo Section (Centered in top half)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.15,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 100,
                height: 100,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Image.asset(
                  'assets/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),

          // 2. Bottom Sheet with Form
          Align(
            alignment: Alignment.bottomCenter,
            child: RefreshIndicator(
              onRefresh: () async {
                await _loadAppSettings();
                await _checkRegistrationEnabled();
              },
              color: buttonColor,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(), // Important for RefreshIndicator to work when content is small
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(32, 40, 32, 32),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(30),
                      topRight: Radius.circular(30),
                    ),
                  ),
                  // Constrain height if needed, or let it grow.
                  // Using minHeight to ensure it covers enough space if content is short.
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height * 0.6,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                    if (!_requires2FA) ...[
                      // Welcome Text
                      const Text(
                        'Welcome Back',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3436),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Email/Password Login Form (only if email auth is enabled)
                      if (_allowEmailAuth) ...[
                        // Username Widget
                        const Text(
                          'Username',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: Color(0xFF636E72),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F6FA),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextField(
                            controller: _emailController,
                            decoration: const InputDecoration(
                              hintText: 'Enter your username',
                              hintStyle: TextStyle(
                                  color: Color(0xFFB2BEC3), fontSize: 14),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Password Widget
                        const Text(
                          'Password',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: Color(0xFF636E72),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F6FA),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextField(
                            controller: _passwordController,
                            obscureText: !_isPasswordVisible,
                            decoration: InputDecoration(
                              hintText: 'Enter your password',
                              hintStyle: const TextStyle(
                                  color: Color(0xFFB2BEC3), fontSize: 14),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _isPasswordVisible
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                  color: const Color(0xFFB2BEC3),
                                  size: 20,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _isPasswordVisible = !_isPasswordVisible;
                                  });
                                },
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Login Button
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: buttonColor,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'LOGIN',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      letterSpacing: 1,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 24),
                      ],

                      // If no email auth, show message to use alternative methods
                      if (!_allowEmailAuth && (_allowGoogleAuth || _enableMobileOTP)) ...[
                        Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.info_outline,
                                size: 48,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Choose a login method below',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 32),
                            ],
                          ),
                        ),
                      ],
                      
                      // Only show divider and alternative login methods if any are enabled
                      if (_allowGoogleAuth || _enableMobileOTP) ...[
                        Row(
                          children: [
                            Expanded(child: Divider(color: Colors.grey[300])),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text('OR',
                                  style: TextStyle(color: Colors.grey[500])),
                            ),
                            Expanded(child: Divider(color: Colors.grey[300])),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Google Sign-In Button (only if enabled)
                      if (_allowGoogleAuth) ...[
                        _buildGoogleButton(),
                        if (_enableMobileOTP) const SizedBox(height: 16),
                      ],
                      
                      // Mobile OTP Login Button (only if enabled)
                      if (_enableMobileOTP) ...[
                        _buildMobileOTPButton(),
                      ],

                      const SizedBox(height: 24),
                      if (_registrationEnabled)
                        Center(
                          child: GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const RegisterScreen(),
                                ),
                              );
                            },
                            child: RichText(
                              text: const TextSpan(
                                text: "Don't have an account? ",
                                style: TextStyle(
                                    color: Color(0xFF636E72), fontSize: 14),
                                children: [
                                  TextSpan(
                                    text: "Sign up",
                                    style: TextStyle(
                                      color: buttonColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ] else ...[
                      // 2FA View matches the cleaner style
                      const Text(
                        'Verify Identity',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3436),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Enter code sent to ${_emailController.text}',
                        style: const TextStyle(
                            color: Color(0xFF636E72), fontSize: 14),
                      ),
                      const SizedBox(height: 32),

                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F6FA),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: 'Enter OTP',
                            hintStyle: TextStyle(
                                color: Color(0xFFB2BEC3), fontSize: 14),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 16, vertical: 14),
                            prefixIcon: Icon(Icons.lock_clock,
                                color: Color(0xFFB2BEC3)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleVerifyOTP,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: buttonColor,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'VERIFY',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _unusedMethodToKeepLinterHappy() {
    return Container();
  }

  Widget _buildGoogleButton() {
    return InkWell(
      onTap: _isLoading ? null : _handleGoogleSignIn,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: Colors.grey[300]!,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/google.png',
              width: 24,
              height: 24,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.g_mobiledata,
                  size: 28,
                  color: Color(0xFF4285F4),
                );
              },
            ),
            const SizedBox(width: 12),
            const Text(
              'Sign in with Google',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF2C3E50),
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileOTPButton() {
    return InkWell(
      onTap: _isLoading
          ? null
          : () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MobileOTPLoginScreen(),
                ),
              );
            },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: Colors.grey[300]!,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(
              Icons.phone_android,
              size: 24,
              color: Color(0xFF4460F1),
            ),
            SizedBox(width: 12),
            Text(
              'Login with Mobile OTP',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF2C3E50),
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

}
