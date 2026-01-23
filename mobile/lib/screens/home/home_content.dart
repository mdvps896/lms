import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/user_model.dart';
import '../../utils/constants.dart';
import '../../widgets/home_header.dart';
import '../../widgets/home_skeleton.dart';
import 'home_body.dart';
 

class HomeContent extends StatefulWidget {
  final User user;
  final Map<String, dynamic>? dashboardData;
  final List<Map<String, dynamic>> courses;
  final List<Map<String, dynamic>> myCourses; // Add myCourses
  final List<Map<String, dynamic>> categories;
  final List<Map<String, dynamic>> coupons;
  final bool isLoading;
  final Future<void> Function() onRefresh;

  const HomeContent({
    super.key,
    required this.user,
    required this.dashboardData,
    required this.courses,
    required this.myCourses, // Add myCourses
    required this.categories,
    required this.coupons,
    required this.isLoading,
    required this.onRefresh,
  });

  @override
  State<HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<HomeContent> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Add a safe delay to ensure Navigator is unlocked and ready
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          _checkAndShowCategorySelection();
        }
      });
    });
  }

  void _checkAndShowCategorySelection() {
    // Check if category is missing
    final category = widget.user.category;
    bool isCategoryMissing = false;

    debugPrint('🔍 Checking category selection...');
    debugPrint('   Category value: $category');
    debugPrint('   Category type: ${category.runtimeType}');

    if (category == null) {
      debugPrint('   ❌ Category is null');
      isCategoryMissing = true;
    } else if (category is String && category.isEmpty) {
      debugPrint('   ❌ Category is empty string');
      isCategoryMissing = true;
    } else if (category is Map && category.isEmpty) {
      debugPrint('   ❌ Category is empty map');
      isCategoryMissing = true;
    } else {
      debugPrint('   ✅ Category is set');
    }

    if (isCategoryMissing) {
      debugPrint('   📱 Showing category selection modal');
      _showMandatoryCategoryModal();
    } else {
      debugPrint('   ✅ Category already selected, skipping modal');
    }
  }

  void _showMandatoryCategoryModal() {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => WillPopScope(
        onWillPop: () async => false, // Prevent back button
        child: Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 10),
              const Icon(Icons.category, size: 50, color: AppConstants.primaryColor),
              const SizedBox(height: 16),
              const Text(
                'Select Your Interest',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please select a category to personalize your experience.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: ListView.builder(
                  itemCount: widget.categories.length,
                  itemBuilder: (context, index) {
                    final cat = widget.categories[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                          child: const Icon(Icons.grid_view_rounded, color: AppConstants.primaryColor, size: 20),
                        ),
                        title: Text(
                          cat['name'] ?? 'Unknown',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: () => _updateCategory(cat['_id']),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _updateCategory(String categoryId) async {
    // Store the context before async operations
    final navigatorContext = Navigator.of(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    
    debugPrint('🔄 Updating category to: $categoryId');
    
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final api = ApiService();
      final result = await api.updateProfile({'category': categoryId});

      debugPrint('📡 API Response: ${result['success']}');

      // Close loading dialog
      if (mounted) {
        navigatorContext.pop();
      }

      if (result['success'] == true) {
        debugPrint('✅ Category updated successfully, refreshing user data...');
        
        // Close modal FIRST
        if (mounted) {
          navigatorContext.pop();
        }
        
        // Refresh data to get updated user object
        await widget.onRefresh();
        
        debugPrint('✅ User data refreshed');
        
        if (mounted) {
          scaffoldMessenger.showSnackBar(
            const SnackBar(
              content: Text('Preferences saved successfully!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        debugPrint('❌ Failed to update category: ${result['message']}');
        if (mounted) {
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to update category'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ Error updating category: $e');
      // Close loading dialog
      if (mounted) {
        navigatorContext.pop();
      }
      
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Note: isLoading is handled in parent now, but good to keep safe
    if (widget.isLoading) {
      return const HomeSkeleton();
    }

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: RefreshIndicator(
          onRefresh: widget.onRefresh,
          color: AppConstants.primaryColor,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              // 1. Sticky Header
              SliverAppBar(
                pinned: true,
                automaticallyImplyLeading: false,
                backgroundColor: AppConstants.secondaryColor,
                titleSpacing: 0,
                elevation: 0,
                scrolledUnderElevation: 0,
                toolbarHeight: 74,
                flexibleSpace: HomeHeader(user: widget.user),
              ),

              // 2. Body Content with Rounded Top
              SliverList(
                delegate: SliverChildListDelegate([
                  Container(
                    decoration: const BoxDecoration(
                      color: AppConstants.backgroundColor,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(30),
                      ),
                    ),
                    child: HomeBody(
                      user: widget.user,
                      courses: widget.courses,
                      myCourses: widget.myCourses,
                      categories: widget.categories,
                      onRefresh: widget.onRefresh,
                    ),
                  ),
                ]),
              ),
            ],
          ),
        ),
    );
  }
}
