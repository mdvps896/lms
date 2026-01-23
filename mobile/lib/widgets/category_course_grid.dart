import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../screens/course_details/course_details_screen.dart';
import '../models/user_model.dart';
import 'common/custom_cached_image.dart';

class CategoryCourseGrid extends StatelessWidget {
  final String? selectedCategory;
  final List<dynamic> courses;
  final User? user;
  final Function()? onRefresh; // Added callback

  const CategoryCourseGrid({
    super.key,
    this.selectedCategory,
    required this.courses,
    this.user,
    this.onRefresh,
  });

  List<dynamic> get filteredCourses {
    if (selectedCategory == null || selectedCategory == 'All') {
      return courses;
    }

    return courses.where((course) {
      final courseCategory = course['category'];
      return courseCategory == selectedCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final displayCourses = filteredCourses.take(4).toList();

    if (displayCourses.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75, // Increased from 0.82 for more room
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: displayCourses.length,
        itemBuilder: (context, index) {
          return _buildCourseCard(context, displayCourses[index]);
        },
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, dynamic course) {
    bool isPurchased = false;
    if (user != null && user!.enrolledCourses != null) {
      final String courseId = (course['id'] ?? course['_id'] ?? '').toString();

      for (var e in user!.enrolledCourses!) {
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
        if (onRefresh != null) onRefresh!();
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
            Stack(
              children: [
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
              ],
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

                    // 2. Added description max 2 lines
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
                                  ? const Color(0xFF1E3A8A) // Navy blue for free courses
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
                              if (onRefresh != null) onRefresh!();
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
}
