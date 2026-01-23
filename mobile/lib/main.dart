import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:screen_protector/screen_protector.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:permission_handler/permission_handler.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/admin/admin_main_screen.dart';
import 'services/api_service.dart';
import 'services/firebase_notification_service.dart';
import 'services/security_service.dart';
import 'utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'utils/globals.dart';

import 'package:flutter/services.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set Status Bar Style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light, // Light icons for dark background
  ));

  // Perform security checks first
  final securityService = SecurityService();
  final securityCheck = await securityService.performSecurityCheck();

  if (!securityCheck['isSecure']) {
    runApp(SecurityBlockedApp(reason: securityCheck['issue']));
    return;
  }

  try {
    await dotenv.load(fileName: "assets/.env");

    // Initialize Firebase
    await Firebase.initializeApp();

    // Initialize Firebase App Check
    await FirebaseAppCheck.instance.activate(
      androidProvider: AndroidProvider.debug, // Use playIntegrity in production
      appleProvider:
          AppleProvider.debug, // Use deviceCheck or appAttest in production
    );

    // Initialize Firebase Messaging
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await FirebaseNotificationService.initialize();

    // Secure Mode: Prevent Screenshots & Screen Recording
    await ScreenProtector.preventScreenshotOn();
    
    // Request camera and location permissions
    await _requestCameraPermission();
    await _requestLocationPermission();
  } catch (e) {
    // Error initializing - app will continue without these features
  }
  runApp(const MyApp());
}

Future<void> _requestLocationPermission() async {
  try {
    final permission = await Permission.location.status;
    if (!permission.isGranted) {
      // Request permission
      await Permission.location.request();
    }
  } catch (e) {
    debugPrint('Error requesting location permission: $e');
  }
}

Future<void> _requestCameraPermission() async {
  try {
    final permission = await Permission.camera.status;
    if (!permission.isGranted) {
      // Request permission
      await Permission.camera.request();
    }
  } catch (e) {
    debugPrint('Error requesting camera permission: $e');
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  bool _isAppInBackground = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    setState(() {
      _isAppInBackground = state != AppLifecycleState.resumed;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: AppConstants.primaryColor,
        scaffoldBackgroundColor: AppConstants.backgroundColor,
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: AppConstants.primaryColor,
          secondary: AppConstants.accentColor,
        ),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: Stack(
        children: [
          const AuthChecker(),
          if (_isAppInBackground)
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  color: Colors.black.withValues(alpha: 0.5),
                  child: const Center(
                    child: Icon(Icons.lock, size: 80, color: Colors.white),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class AuthChecker extends StatefulWidget {
  const AuthChecker({super.key});

  @override
  State<AuthChecker> createState() => _AuthCheckerState();
}

class _AuthCheckerState extends State<AuthChecker> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final apiService = ApiService();
    final user = await apiService.getSavedUser();
    final prefs = await SharedPreferences.getInstance();
    final bool seenOnboarding = prefs.getBool('seenOnboarding') ?? false;

    // Request notification permission for logged-in users
    // Don't await this to prevent blocking app startup if network is slow/unstable
    final token = await apiService.getToken();

    // Request notification permission for logged-in users
    // Don't await this to prevent blocking app startup if network is slow/unstable
    if (user != null && token != null) {
      _requestNotificationPermission();
    }

    if (mounted) {
      if (user != null && token != null) {
        // Check user role and navigate accordingly
        if (user.role == 'admin') {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const AdminMainScreen()),
          );
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
        }
      } else {
        if (!seenOnboarding) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const OnboardingScreen()),
          );
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
      }
    }
  }

  Future<void> _requestNotificationPermission() async {
    try {
      await FirebaseNotificationService.initialize();
      final token = await FirebaseNotificationService.getFCMToken();

      // Save token to backend with timeout to prevent hanging
      if (token != null) {
        final apiService = ApiService();
        await apiService
            .saveFCMToken(token)
            .timeout(
              const Duration(seconds: 5),
              onTimeout: () {
                return false; // Return false on timeout
              },
            );
      }

      // Subscribe to general topic
      await FirebaseNotificationService.subscribeToTopic('all_users');
    } catch (e) {
      // Error requesting notification permission - continue without notifications
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: CircularProgressIndicator(color: AppConstants.primaryColor),
      ),
    );
  }
}

// Security Blocked App Widget
class SecurityBlockedApp extends StatelessWidget {
  final String reason;

  const SecurityBlockedApp({super.key, required this.reason});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Colors.red[50],
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.security, size: 100, color: Colors.red[700]),
                const SizedBox(height: 24),
                Text(
                  'Security Alert',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.red[900],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  reason,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, color: Colors.red[800]),
                ),
                const SizedBox(height: 24),
                Text(
                  'This app cannot run on modified or emulated devices for security reasons.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
