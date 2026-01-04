import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../utils/constants.dart';
import '../screens/course_details/course_details_screen.dart';
import '../models/user_model.dart';
import 'common/custom_cached_image.dart';

class CategoryCourseSlider extends StatefulWidget {
  final String? selectedCategory;
  final List<dynamic> courses;
  final bool isLoading;
  final User? user; // Accept user
  final Function()? onRefresh; // Accept callback

  const CategoryCourseSlider({
    super.key,
    this.selectedCategory,
    required this.courses,
    this.isLoading = false,
    this.user,
    this.onRefresh,
  });

  @override
  State<CategoryCourseSlider> createState() => _CategoryCourseSliderState();
}

class _CategoryCourseSliderState extends State<CategoryCourseSlider> {
  final PageController _pageController = PageController(viewportFraction: 0.92);
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<dynamic> get filteredCourses {
    if (widget.selectedCategory == null || widget.selectedCategory == 'All') {
      return widget.courses;
    }
    return widget.courses
        .where((course) => course['category'] == widget.selectedCategory)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return _buildSkeletonLoader();
    }

    final courses = filteredCourses;
    
    if (courses.isEmpty) {
      return const SizedBox.shrink();
    }

    final limitedCourses = courses.take(10).toList();

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index % ((limitedCourses.length / 2).ceil());
              });
            },
            itemCount: (limitedCourses.length / 2).ceil(),
            itemBuilder: (context, pageIndex) {
              final startIndex = pageIndex * 2;
              final endIndex = (startIndex + 2 > limitedCourses.length) 
                  ? limitedCourses.length 
                  : startIndex + 2;
              final pageCourses = limitedCourses.sublist(startIndex, endIndex);
              
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildCourseCard(pageCourses[0]),
                    ),
                    if (pageCourses.length > 1) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildCourseCard(pageCourses[1]),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            (limitedCourses.length / 2).ceil(),
            (index) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentPage == index ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: _currentPage == index
                    ? AppConstants.primaryColor
                    : Colors.grey[300],
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
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
        height: 220,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: AppConstants.primaryColor.withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 5)),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              Positioned.fill(
                child: Stack(
                  children: [
                    course['thumbnail'] != null
                      ? SizedBox( height: 220, child: CustomCachedImage(imageUrl: course['thumbnail'], fit: BoxFit.cover)) // Added SizeBox to prevent layout errors in Stack if needed, though positioned fill usually handles it. But 'Image.network' had fit cover.
                      : Container(color: AppConstants.primaryColor.withOpacity(0.3), child: const Center(child: Icon(Icons.book_rounded, size: 50, color: Colors.white))),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.black.withOpacity(0.7), Colors.black.withOpacity(0.3)],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(color: AppConstants.accentColor, borderRadius: BorderRadius.circular(8)),
                          child: Text(course['category'] ?? 'General', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, size: 16, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(course['rating']?.toString() ?? '4.5', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course['title'] ?? 'Untitled Course', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                              child: Text(
                                isPurchased ? 'Enrolled' : '₹${course['price'] ?? '999'}',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isPurchased ? Colors.green : AppConstants.primaryColor),
                              ),
                            ),
                            Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isPurchased ? Colors.green : AppConstants.primaryColor,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(isPurchased ? 'Open' : 'Buy', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSkeletonLoader() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(children: [Expanded(child: _buildSkeletonCard()), const SizedBox(width: 12), Expanded(child: _buildSkeletonCard())]),
      ),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(height: 220, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)));
  }
}
