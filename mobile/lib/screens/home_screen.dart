import 'package:flutter/material.dart';
import 'dart:async';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../widgets/custom_footer.dart';
import '../widgets/side_menu.dart';
import '../widgets/home_skeleton.dart';
import 'login_screen.dart';
import 'my_courses_screen.dart';
import 'free_materials/free_materials_screen.dart';
import 'help_support_screen.dart';
import 'home/home_content.dart'; // Extracted component

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  User? _user;
  Map<String, dynamic>? _dashboardData;
  List<Map<String, dynamic>> _myCourses = []; // Added myCourses state
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _coupons = []; // Add coupons state
  bool _isLoading = true;
  final ApiService _apiService = ApiService();
  final GlobalKey<ScaffoldState> _scaffoldKey =
      GlobalKey<ScaffoldState>(); // Key for Drawer
  Timer? _sessionCheckTimer; // Timer for session checking

  @override
  void initState() {
    super.initState();
    _loadData();
    _startSessionCheck(); // Start periodic session checking
  }

  @override
  void dispose() {
    _sessionCheckTimer?.cancel(); // Cancel timer when widget is disposed
    super.dispose();
  }

  void _startSessionCheck() {
    // Check session every 30 seconds
    _sessionCheckTimer = Timer.periodic(const Duration(seconds: 30), (
      timer,
    ) async {
      final result = await _apiService.checkSession();
      if (result['forceLogout'] == true) {
        timer.cancel();
        if (mounted) {
          // Clear local data
          await _apiService.clearUserData();

          // Store context before async gap
          final navigator = Navigator.of(context);
          final messenger = ScaffoldMessenger.of(context);

          // Show message and navigate to login
          messenger.showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'You have been logged out'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 5),
            ),
          );

          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        }
      }
    });
  }

  Future<void> _loadData() async {
    try {
      User? user = await _apiService.getSavedUser();
      // Try to refresh user profile from server to get latest enrollments
      try {
        final refreshedUser = await _apiService.refreshUserProfile();
        if (refreshedUser != null) {
          user = refreshedUser;
        }
      } catch (e) {
      }

      if (user == null) {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
        return;
      }

      if (mounted) {
        setState(() {
          _user = user;
        });
      }

      // Fetch data - continue even if dashboard fails
      Map<String, dynamic>? dashboardData;
      List<Map<String, dynamic>> courses = [];
      List<Map<String, dynamic>> categories = [];
      List<Map<String, dynamic>> myCourses = [];

      try {
        dashboardData = await _apiService.getDashboardData();
      } catch (e) {
        dashboardData = null;
      }

      try {
        courses = await _apiService.getCourses();
      } catch (e) {
      }

      try {
        myCourses = await _apiService.getMyCourses();
      } catch (e) {
      }

      try {
        categories = await _apiService.getCategories();
      } catch (e) {
      }

      // Fetch coupons
      List<Map<String, dynamic>> coupons = [];
      try {
        coupons = await _apiService.getCoupons();
      } catch (e) {
      }

      if (mounted) {
        setState(() {
          _dashboardData = dashboardData;
          _courses = courses;
          _myCourses = myCourses;
          _categories = categories;
          _coupons = coupons;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _refreshData() async {
    try {
      debugPrint('🔄 Starting data refresh...');
      
      // Refresh user profile first to get latest enrollments
      final refreshedUser = await _apiService.refreshUserProfile();
      if (refreshedUser != null) {
        debugPrint('👤 User refreshed - Category: ${refreshedUser.category}');
        if (mounted) {
          setState(() => _user = refreshedUser);
          debugPrint('✅ User state updated in HomeScreen');
        }
      } else {
        debugPrint('❌ Failed to refresh user');
      }

      // Fetch dashboard data, courses, categories, and myCourses in parallel
      final results = await Future.wait([
        _apiService.getDashboardData(),
        _apiService.getCourses(),
        _apiService.getCategories(),
        _apiService.getMyCourses(),
      ]);

      if (mounted) {
        setState(() {
          _dashboardData = results[0] as Map<String, dynamic>;
          _courses = results[1] as List<Map<String, dynamic>>;
          _categories = results[2] as List<Map<String, dynamic>>;
          _myCourses = results[3] as List<Map<String, dynamic>>;
        });
        debugPrint('✅ Dashboard data refreshed');
      }
    } catch (e) {
      debugPrint('❌ Error refreshing data: $e');
    }
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_user == null) {
      return const HomeSkeleton(); // Use user check as initial load mostly
    }

    // Pass dashboardData, courses, categories, and coupons to _HomeContent
    final homeContent = HomeContent(
      user: _user!,
      dashboardData: _dashboardData,
      courses: _courses,
      myCourses: _myCourses,
      categories: _categories,
      coupons: _coupons,
      isLoading: _isLoading,
      onRefresh: _refreshData,
    );

    // ... rest of build method ...
    final List<Widget> pages = [
      homeContent,
      const FreeMaterialsScreen(),
      const MyCoursesScreen(),
      const HelpSupportScreen(),
      homeContent,
    ];

    return Scaffold(
      key: _scaffoldKey,
      endDrawer: SideMenu(user: _user!, onTabChange: _onTabTapped),
      body:
          _isLoading
              ? const HomeSkeleton()
              : pages[_currentIndex], // Show Skeleton if loading
      bottomNavigationBar: CustomFooter(
        currentIndex: _currentIndex,
        onTap: (index) {
          if (index == 4) {
            _scaffoldKey.currentState?.openEndDrawer();
            // Optional: Don't change tab if just opening drawer
            // But if we want to highlight Menu icon, we keep it.
            // _onTabTapped(index);
          } else {
            _onTabTapped(index);
          }
        },
      ),
    );
  }
}
