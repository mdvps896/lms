import 'package:carousel_slider/carousel_slider.dart'; // import added
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../widgets/custom_footer.dart';
import '../widgets/home_header.dart';
import '../widgets/category_list.dart';
import '../widgets/category_course_slider.dart'; // New import
import '../widgets/category_course_grid.dart'; // Grid widget
import '../widgets/course_slider.dart';
import '../widgets/coupon_slider.dart'; // Coupon slider import
import '../widgets/continue_learning_card.dart';
import '../widgets/free_material_grid.dart'; // import added
import '../widgets/section_title.dart';
import '../widgets/side_menu.dart'; // import added
import '../widgets/sticky_search_bar.dart'; // import added
import '../widgets/home_skeleton.dart'; // import added
import '../utils/dummy_courses.dart'; // Dummy courses data
import 'category_courses_page.dart'; // Category page
import 'login_screen.dart';
import 'profile_screen.dart';
import 'my_courses_screen.dart';
import 'free_materials/free_materials_screen.dart';
import 'help_support_screen.dart';
import 'search_screen.dart';
import 'course_details/course_details_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  User? _user;
  Map<String, dynamic>? _dashboardData;
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _coupons = []; // Add coupons state
  bool _isLoading = true;
  final ApiService _apiService = ApiService();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>(); // Key for Drawer

  @override
  void initState() {
    super.initState();
    _loadData();
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
        print('Failed to refresh user profile: $e');
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

      setState(() {
        _user = user;
      });

      // Fetch data - continue even if dashboard fails
      Map<String, dynamic>? dashboardData;
      List<Map<String, dynamic>> courses = [];
      List<Map<String, dynamic>> categories = [];

      try {
        dashboardData = await _apiService.getDashboardData();
      } catch (e) {
        print('Dashboard API failed (continuing anyway): $e');
        dashboardData = null;
      }

      try {
        courses = await _apiService.getCourses();
        print('✅ Fetched ${courses.length} courses from API');
        if (courses.isNotEmpty) {
          final firstCourse = courses.first;
          print('📦 First course data:');
          print('  - Title: ${firstCourse['title']}');
          print('  - GST Enabled: ${firstCourse['gstEnabled']}');
          print('  - GST %: ${firstCourse['gstPercentage']}');
          print('  - Demo Video: ${firstCourse['demoVideo']}');
        }
      } catch (e) {
        print('Courses API failed: $e');
      }

      try {
        categories = await _apiService.getCategories();
      } catch (e) {
        print('Categories API failed: $e');
      }

      // Fetch coupons
      List<Map<String, dynamic>> coupons = [];
      try {
        coupons = await _apiService.getCoupons();
        print('✅ Fetched ${coupons.length} coupons from API');
      } catch (e) {
        print('Coupons API failed: $e');
      }

      print('Home Screen - Courses loaded: ${courses.length}');
      print('Home Screen - Categories loaded: ${categories.length}');
      print('Home Screen - Coupons loaded: ${coupons.length}');

      setState(() {
        _dashboardData = dashboardData;
        _courses = courses;
        _categories = categories;
        _coupons = coupons;
        _isLoading = false;
      });
      
      print('Home Screen - State updated with ${_courses.length} courses, ${_categories.length} categories, and ${_coupons.length} coupons');
    } catch (e) {
      print('Error loading home data: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshData() async {
    try {
      // Refresh user profile first to get latest enrollments
      final refreshedUser = await _apiService.refreshUserProfile();
      if (refreshedUser != null) {
        setState(() => _user = refreshedUser);
      }
      
      // Fetch dashboard data, courses, and categories in parallel
      final results = await Future.wait([
        _apiService.getDashboardData(),
        _apiService.getCourses(),
        _apiService.getCategories(),
      ]);

      setState(() {
        _dashboardData = results[0] as Map<String, dynamic>;
        _courses = results[1] as List<Map<String, dynamic>>;
        _categories = results[2] as List<Map<String, dynamic>>;
      });
    } catch (e) {
      print('Error refreshing data: $e');
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
    final homeContent = _HomeContent(
      user: _user!,
      dashboardData: _dashboardData,
      courses: _courses,
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
      endDrawer: SideMenu(
        user: _user!,
        onTabChange: _onTabTapped,
      ), 
      body: _isLoading ? const HomeSkeleton() : pages[_currentIndex], // Show Skeleton if loading
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

class _HomeContent extends StatefulWidget {
  final User user;
  final Map<String, dynamic>? dashboardData;
  final List<Map<String, dynamic>> courses;
  final List<Map<String, dynamic>> categories;
  final List<Map<String, dynamic>> coupons;
  final bool isLoading;
  final Future<void> Function() onRefresh;

  const _HomeContent({
    required this.user,
    required this.dashboardData,
    required this.courses,
    required this.categories,
    required this.coupons,
    required this.isLoading,
    required this.onRefresh,
  });

  @override
  State<_HomeContent> createState() => _HomeContentState();
}


class _HomeContentState extends State<_HomeContent> {
  String _selectedCategory = 'All';

  Color _getCourseColor(int index) {
    final colors = [
      Colors.blue,
      Colors.purple,
      Colors.orange,
      Colors.green,
      Colors.cyan,
      Colors.pink,
      Colors.teal,
      Colors.indigo,
    ];
    return colors[index % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    // Note: isLoading is handled in parent now, but good to keep safe
    if (widget.isLoading) {
      return const HomeSkeleton();
    }

    final myExams = widget.dashboardData?['myExams'] as List<dynamic>? ?? [];
    
    // Get purchased courses from enrolled courses
    final enrolledCourses = widget.user.enrolledCourses ?? [];
    final List<Map<String, dynamic>> continueLearningItems = [];
    
    // Build continue learning items from enrolled courses
    for (var enrollment in enrolledCourses) {
      String? courseId;
      List? completedLectures;

      if (enrollment is Map) {
        courseId = enrollment['courseId']?.toString() ?? enrollment['course']?.toString();
        completedLectures = enrollment['completedLectures'] as List?;
      } else if (enrollment is String) {
        courseId = enrollment;
      }
      
      if (courseId == null || courseId.isEmpty) continue;
      
      // Find matching course from courses list
      final course = widget.courses.firstWhere(
        (c) => c['_id'] == courseId || c['id'] == courseId,
        orElse: () => {},
      );
      
      if (course.isNotEmpty) {
        String categoryName = 'Learning';
        if (course['category'] is Map) {
          categoryName = course['category']['name'] ?? 'Learning';
        } else if (course['category'] is String) {
          categoryName = course['category'];
        }

        // Calculate progress from enrollment data
        double progress = 0.0;
        final int totalLectures = int.tryParse(course['totalLectures']?.toString() ?? '0') ?? 0;
        
        if (totalLectures > 0 && completedLectures != null) {
          progress = (completedLectures.length / totalLectures).clamp(0.0, 1.0);
        }

        continueLearningItems.add({
          'courseId': courseId,
          'title': course['title'] ?? 'Course',
          'subtitle': categoryName,
          'progress': progress,
          'color': _getCourseColor(continueLearningItems.length),
          'icon': Icons.play_circle_outline,
          'thumbnail': course['thumbnail'],
        });
      }
    }

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: widget.onRefresh,
          color: AppConstants.primaryColor,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
            // 1. Non-sticky Profile Header
            SliverToBoxAdapter(
              child: HomeHeader(user: widget.user),
            ),

            // 2. Sticky Search Bar
            SliverPersistentHeader(
              pinned: true,
              delegate: StickySearchBar(),
            ),

            // 3. Body Content
            SliverList(
              delegate: SliverChildListDelegate([

                 const SizedBox(height: 10),

                // 1. Main Course Slider (Hero Section)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5.0), 
                  child: CourseSlider(
                    exams: widget.courses, 
                    user: widget.user,
                    onRefresh: widget.onRefresh, // Pass refresh callback
                  ),
                ),

                const SizedBox(height: 24),

                // 2. Coupon Slider (if available)
                if (widget.coupons.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  CouponSlider(coupons: widget.coupons),
                  const SizedBox(height: 24),
                ],

                // 3. Continue Learning (Only show if user has enrolled courses)
                if (continueLearningItems.isNotEmpty) ...[
                  const SectionTitle(title: 'Continue Learning'),
                  
                  // 2 items visible, 1 by 1 scroll
                  CarouselSlider(
                    options: CarouselOptions(
                      height: 180, // Taller for the card vertical layout
                      viewportFraction: 0.45, // ~50% width with gap
                      enableInfiniteScroll: false,
                      padEnds: false, // Align left
                      disableCenter: true,
                      pageSnapping: false, // Free scroll or snap 1 by 1? standard false helps 1 by 1 feel
                    ),
                    items: continueLearningItems.map<Widget>((item) {
                       return GestureDetector(
                         onTap: () {
                           Navigator.push(
                             context,
                             MaterialPageRoute(
                               builder: (context) => CourseDetailsScreen(
                                 courseId: item['courseId'],
                               ),
                             ),
                           );
                         },
                         child: ContinueLearningCard(
                            title: item['title'],
                            subtitle: item['subtitle'],
                            progress: item['progress'],
                            color: item['color'],
                            icon: item['icon'],
                            courseId: item['courseId'],
                         ),
                       );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),
                ],

                // 4. Free Materials
                SectionTitle(title: 'Free Materials', onSeeAll: () {}),
                const FreeMaterialGrid(),

                const SizedBox(height: 24),

                // 4. Category Slider - Real Categories from API
                SectionTitle(
                  title: 'Categories', 
                  onSeeAll: () {} 
                ),
                CategoryList(
                  categories: widget.categories,
                  onCategorySelected: (category) {
                    setState(() {
                      _selectedCategory = category;
                    });
                  },
                ),
                
                const SizedBox(height: 24),

                // 5. All Courses Slider (filtered by category) - Real Courses
                SectionTitle(
                  title: _selectedCategory == 'All' 
                      ? 'All Courses' 
                      : '$_selectedCategory Courses',
                  onSeeAll: () {
                    // Get filtered courses from real data
                    final filteredCourses = _selectedCategory == 'All'
                        ? widget.courses
                        : widget.courses.where((course) => 
                            course['category'] == _selectedCategory).toList();
                    
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CategoryCoursesPage(
                          categoryName: _selectedCategory == 'All' 
                              ? 'All Courses' 
                              : '$_selectedCategory Courses',
                          courses: widget.courses, // Pass all courses, page handles filtering
                          categories: widget.categories, // Pass real categories
                          user: widget.user, // Pass user for enrollment check
                          onRefresh: widget.onRefresh, // Pass refresh callback
                        ),
                      ),
                    );
                  },
                ),
                CategoryCourseGrid(
                  selectedCategory: _selectedCategory,
                  courses: widget.courses,
                  user: widget.user,
                  onRefresh: widget.onRefresh, // Pass refresh callback
                ),

                const SizedBox(height: 30),
              ]),
            ),
          ],
        ),
        ),
      ),
    );
  }
}

class _MyExamsContent extends StatelessWidget {
  final Map<String, dynamic>? dashboardData;
  final bool isLoading;

  const _MyExamsContent({required this.dashboardData, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Center(child: CircularProgressIndicator());
    
    final myExams = dashboardData?['myExams'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Exams', style: TextStyle(color: AppConstants.textPrimary)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppConstants.textPrimary),
      ),
      backgroundColor: AppConstants.backgroundColor,
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: myExams.length,
        itemBuilder: (context, index) {
          final exam = myExams[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppConstants.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          exam['category'] ?? 'General',
                          style: const TextStyle(
                            color: AppConstants.primaryColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      Icon(Icons.more_horiz, color: Colors.grey[400]),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    exam['title'] ?? 'Untitled',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${exam['date']} • ${exam['time']}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: () {
                          // Start Exam Logic
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                        ),
                        child: const Text('Start', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
