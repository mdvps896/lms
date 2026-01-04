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
        if (onRefresh != null) onRefresh!();
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
                          child: Text(course['category'] ?? 'General', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
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
                  children: [
                    Text(course['title'] ?? 'Untitled Course', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
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
                            if (onRefresh != null) onRefresh!();
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
}
