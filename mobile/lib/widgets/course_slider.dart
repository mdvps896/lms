import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../screens/course_details/course_details_screen.dart';
import '../models/user_model.dart';
import 'common/custom_cached_image.dart';

class CourseSlider extends StatelessWidget {
  final List<dynamic> exams;
  final User? user;
  final Function()? onRefresh;

  const CourseSlider({super.key, required this.exams, this.user, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (exams.isEmpty) {
      return Container(
        height: 360,
        margin: const EdgeInsets.symmetric(horizontal: 4.0),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.school_outlined, size: 60, color: Colors.grey[400]),
              SizedBox(height: 12),
              Text(
                'No courses available',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Safely map to a list of maps, preventing type cast errors
    final slides = exams.map((courseData) {
      final Map<String, dynamic> course = Map<String, dynamic>.from(courseData as Map);
      
      final price = int.tryParse(course['price']?.toString() ?? '0') ?? 0;
      final originalPrice = price > 0 ? (price * 1.5).round() : 0;
      final discountPercent = originalPrice > 0 
          ? (((originalPrice - price) / originalPrice) * 100).round()
          : 0;
      
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

      return {
        ...course,
        'price_text': '₹$price',
        'originalPrice_text': '₹$originalPrice',
        'discount_text': discountPercent > 0 ? '$discountPercent% OFF' : 'NEW',
        'isPurchased': isPurchased,
        'image': course['thumbnail'] ?? 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
      };
    }).toList();

    return CarouselSlider(
      options: CarouselOptions(
        height: 360.0,
        autoPlay: true,
        enlargeCenterPage: true,
        enlargeFactor: 0.2,
        viewportFraction: 0.91,
        autoPlayCurve: Curves.easeInOut,
        autoPlayInterval: const Duration(seconds: 3),
        autoPlayAnimationDuration: const Duration(milliseconds: 800),
        enableInfiniteScroll: slides.length > 1,
      ),
      items: slides.map((slide) {
        return GestureDetector(
           onTap: () async {
             await Navigator.push(
               context, 
               MaterialPageRoute(builder: (context) => CourseDetailsScreen(course: slide)),
             );
             if (onRefresh != null) onRefresh!();
           },
           child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4.0),
            decoration: BoxDecoration(
              color: const Color(0xFF6C63FF),
              borderRadius: BorderRadius.circular(16), 
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CustomCachedImage(imageUrl: slide['image'].toString(), fit: BoxFit.cover),
                  Container(color: Colors.black.withOpacity(0.5)),
                  Stack(
                    children: [
                      if (slide['isPurchased'] == true)
                        Positioned(
                          top: 20,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.greenAccent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.check_circle, size: 14, color: Colors.black),
                                SizedBox(width: 4),
                                Text('Purchased', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                          ),
                        )
                      else
                        Positioned(
                          top: 20,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppConstants.accentColor,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(slide['discount_text'].toString(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ),

                      Positioned(
                        bottom: 20,
                        left: 20,
                        right: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(slide['title'].toString(), style: const TextStyle(fontSize: 24.0, fontWeight: FontWeight.bold, color: Colors.white, height: 1.1), maxLines: 2, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 6),
                            Text(slide['description'].toString(), style: const TextStyle(fontSize: 14.0, color: Colors.white70, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                 if (slide['isPurchased'] != true) ...[
                                   Column(
                                     crossAxisAlignment: CrossAxisAlignment.start,
                                     children: [
                                       Text(slide['originalPrice_text'].toString(), style: const TextStyle(fontSize: 14.0, color: Colors.white54, decoration: TextDecoration.lineThrough)),
                                       Text(slide['price_text'].toString(), style: const TextStyle(fontSize: 22.0, fontWeight: FontWeight.bold, color: AppConstants.accentColor)),
                                     ],
                                   ),
                                   const Spacer(),
                                 ] else const Spacer(),

                                 ElevatedButton(
                                   onPressed: () async {
                                     await Navigator.push(
                                       context, 
                                       MaterialPageRoute(builder: (context) => CourseDetailsScreen(course: slide)),
                                     );
                                     if (onRefresh != null) onRefresh!();
                                   },
                                   style: ElevatedButton.styleFrom(
                                     backgroundColor: slide['isPurchased'] == true ? Colors.red : AppConstants.accentColor,
                                     foregroundColor: slide['isPurchased'] == true ? Colors.white : Colors.black,
                                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                     padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                   ),
                                   child: Text(slide['isPurchased'] == true ? 'Continue Learning' : 'Buy Now', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                 ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
