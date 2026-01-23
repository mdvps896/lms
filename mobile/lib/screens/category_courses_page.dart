import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../utils/constants.dart';
import '../widgets/custom_footer.dart';
import '../widgets/common/custom_cached_image.dart';
import 'course_details/course_details_screen.dart';
import '../models/user_model.dart';

class CategoryCoursesPage extends StatefulWidget {
  final String categoryName;
  final List<dynamic> courses;
  final List<dynamic> categories;
  final User? user;
  final Function()? onRefresh;

  const CategoryCoursesPage({
    super.key,
    required this.categoryName,
    required this.courses,
    required this.categories,
    this.user,
    this.onRefresh,
  });

  @override
  State<CategoryCoursesPage> createState() => _CategoryCoursesPageState();
}

class _CategoryCoursesPageState extends State<CategoryCoursesPage> {
  String _searchQuery = '';
  int _currentIndex = 0;
  late String _selectedCategory;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedCategory =
        widget.categoryName.contains('All')
            ? 'All'
            : widget.categoryName.replaceFirst(' Courses', '');
  }

  List<String> get categoryNames {
    List<String> names = ['All'];
    for (var cat in widget.categories) {
      if (cat is Map && cat['name'] != null) {
        names.add(cat['name']);
      } else if (cat is String) {
        names.add(cat);
      }
    }
    return names;
  }

  List<dynamic> get filteredCourses {
    var courses = widget.courses;

    // Filter by category
    if (_selectedCategory != 'All') {
      courses =
          courses.where((course) {
            final cat = course['category'];
            if (cat is Map) return cat['name'] == _selectedCategory;
            return cat == _selectedCategory;
          }).toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      courses =
          courses.where((course) {
            final title = course['title']?.toString().toLowerCase() ?? '';
            return title.contains(_searchQuery.toLowerCase());
          }).toList();
    }

    return courses;
  }

  @override
  Widget build(BuildContext context) {
    final courses = filteredCourses;
    final displayCategories = categoryNames;

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text(
          _selectedCategory == 'All'
              ? 'All Courses'
              : '$_selectedCategory Courses',
          style: const TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: TextField(
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search courses...',
                prefixIcon: const Icon(
                  Icons.search,
                  color: AppConstants.primaryColor,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),

          // Category Slider
          Container(
            color: Colors.white,
            padding: const EdgeInsets.only(bottom: 16),
            child: SizedBox(
              height: 38,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: displayCategories.length,
                itemBuilder: (context, index) {
                  final isSelected =
                      displayCategories[index] == _selectedCategory;
                  return GestureDetector(
                    onTap: () async {
                      if (isSelected) return;
                      setState(() {
                        _isLoading = true;
                      });

                      await Future.delayed(const Duration(milliseconds: 200));

                      setState(() {
                        _selectedCategory = displayCategories[index];
                        _isLoading = false;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color:
                            isSelected
                                ? AppConstants.primaryColor
                                : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color:
                              isSelected
                                  ? AppConstants.primaryColor
                                  : Colors.grey.shade300,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          displayCategories[index],
                          style: TextStyle(
                            color:
                                isSelected
                                    ? Colors.white
                                    : AppConstants.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Course Grid
          Expanded(
            child:
                _isLoading
                    ? _buildSkeletonGrid()
                    : courses.isEmpty
                    ? const Center(
                      child: Text(
                        'No courses found',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                    : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.75, // Increased from 0.82
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                      itemCount: courses.length,
                      itemBuilder: (context, index) {
                        return _buildCourseCard(courses[index]);
                      },
                    ),
          ),
        ],
      ),
      bottomNavigationBar: CustomFooter(
        currentIndex: _currentIndex,
        onTap: (index) {
          if (index == 0) {
            Navigator.maybePop(context);
          } else {
            setState(() {
              _currentIndex = index;
            });
          }
        },
      ),
    );
  }

  Widget _buildCourseCard(dynamic course) {
    bool isPurchased = false;
    if (widget.user != null && widget.user!.enrolledCourses != null) {
      final String courseId = (course['id'] ?? course['_id'] ?? '').toString();

      for (var e in widget.user!.enrolledCourses!) {
        String id = '';
        DateTime? expiry;

        if (e is String) {
          id = e;
        } else if (e is Map) {
          final cIdRaw = e['courseId'] ?? e['course'];
          if (cIdRaw is Map) {
            id = (cIdRaw['_id'] ?? cIdRaw['id'] ?? '').toString();
          } else {
            id = (cIdRaw ?? '').toString();
          }
          if (e['expiresAt'] != null) {
            expiry = DateTime.tryParse(e['expiresAt'].toString());
          }
        }

        if (id.isNotEmpty && id == courseId) {
          if (expiry == null || DateTime.now().isBefore(expiry)) {
            isPurchased = true;
            break;
          }
        }
      }
    }

    final price = int.tryParse(course['price']?.toString() ?? '0') ?? 0;
    final isFree = price <= 0;

    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CourseDetailsScreen(course: course),
          ),
        );
        if (widget.onRefresh != null) widget.onRefresh!();
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.grey[300]!,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              child:
                  course['thumbnail'] != null
                      ? CustomCachedImage(
                        imageUrl: course['thumbnail'],
                        height: 110,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      )
                      : Container(
                        height: 110,
                        color: AppConstants.primaryColor,
                        child: const Icon(
                          Icons.book_rounded,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
            ),

            // Content Section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course['title'] ?? 'Untitled Course',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF2D3436),
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),

                    Text(
                      course['description'] ?? 'No description available',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                        height: 1.2,
                      ),
                    ),

                    const Spacer(),

                    // Footer: Full-width Button
                    SizedBox(
                      width: double.infinity,
                      child: Container(
                        decoration: BoxDecoration(
                          color:
                              isPurchased
                                  ? Colors.green
                                  : isFree
                                  ? const Color(0xFF1E3A8A)
                                  : AppConstants.secondaryColor,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: (isPurchased
                                      ? Colors.green
                                      : isFree
                                      ? const Color(0xFF1E3A8A)
                                      : AppConstants.secondaryColor)
                                  .withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder:
                                      (context) =>
                                          CourseDetailsScreen(course: course),
                                ),
                              );
                              if (widget.onRefresh != null) widget.onRefresh!();
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      isPurchased
                                          ? Icons.play_circle_outline
                                          : isFree
                                          ? Icons.card_giftcard
                                          : Icons.shopping_cart_outlined,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      isPurchased
                                          ? 'Open'
                                          : isFree
                                          ? 'Enroll'
                                          : 'Buy Now',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeletonGrid() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.85,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (context, index) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
          );
        },
      ),
    );
  }
}
