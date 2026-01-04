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
    _selectedCategory = widget.categoryName.contains('All') ? 'All' : widget.categoryName.replaceFirst(' Courses', '');
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
      courses = courses.where((course) {
        final cat = course['category'];
        if (cat is Map) return cat['name'] == _selectedCategory;
        return cat == _selectedCategory;
      }).toList();
    }
    
    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      courses = courses.where((course) {
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
          _selectedCategory == 'All' ? 'All Courses' : '$_selectedCategory Courses',
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
                prefixIcon: const Icon(Icons.search, color: AppConstants.primaryColor),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                  final isSelected = displayCategories[index] == _selectedCategory;
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
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppConstants.primaryColor : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? AppConstants.primaryColor : Colors.grey.shade300,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          displayCategories[index],
                          style: TextStyle(
                            color: isSelected ? Colors.white : AppConstants.textPrimary,
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
            child: _isLoading
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
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
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
               if (e['expiresAt'] != null) expiry = DateTime.tryParse(e['expiresAt'].toString());
            }
            
            if (id.isNotEmpty && id == courseId) {
               if (expiry == null || DateTime.now().isBefore(expiry)) {
                   isPurchased = true;
                   break;
               }
            }
        }
    }

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
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
              child: Stack(
                children: [
                  course['thumbnail'] != null
                      ? CustomCachedImage(imageUrl: course['thumbnail'], height: 110, width: double.infinity, fit: BoxFit.cover)
                      : Container(height: 110, color: AppConstants.primaryColor, child: const Icon(Icons.book_rounded, size: 40, color: Colors.white)),
                  
                  Positioned(
                    top: 8, left: 8, right: 8,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppConstants.accentColor, borderRadius: BorderRadius.circular(6)),
                          child: Text(
                             (course['category'] is Map) ? course['category']['name'] : (course['category'] ?? 'General'),
                             style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(6)),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, size: 12, color: Colors.amber),
                              const SizedBox(width: 2),
                              Text(course['rating']?.toString() ?? '4.5', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(widget.courses.isNotEmpty ? course['title'] ?? 'Untitled Course' : 'Untitled Course', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 2),
                    Text(
                      course['description'] ?? 'No description available.', 
                      maxLines: 2, 
                      overflow: TextOverflow.ellipsis, 
                      style: TextStyle(fontSize: 9, color: Colors.grey[600], height: 1.1)
                    ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (!isPurchased)
                            Text('₹${course['price'] ?? '999'}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppConstants.primaryColor))
                        else
                             const Text('Enrolled', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
                            
                        ElevatedButton(
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => CourseDetailsScreen(course: course)),
                            );
                            if (widget.onRefresh != null) widget.onRefresh!();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isPurchased ? Colors.green : AppConstants.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          child: Text(isPurchased ? 'Continue' : 'Buy Now', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ],
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
