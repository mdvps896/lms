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

  const CourseSlider({
    super.key,
    required this.exams,
    this.user,
    this.onRefresh,
  });

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
    final slides =
        exams.map((courseData) {
          final Map<String, dynamic> course = Map<String, dynamic>.from(
            courseData as Map,
          );

          final price = int.tryParse(course['price']?.toString() ?? '0') ?? 0;
          final originalPrice = price > 0 ? (price * 1.5).round() : 0;
          final discountPercent =
              originalPrice > 0
                  ? (((originalPrice - price) / originalPrice) * 100).round()
                  : 0;

          bool isPurchased = false;
          if (user != null && user!.enrolledCourses != null) {
            final String courseId =
                (course['id'] ?? course['_id'] ?? '').toString();

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

          return {
            ...course,
            'price_text': '₹$price',
            'originalPrice_text': '₹$originalPrice',
            'discount_text':
                discountPercent > 0 ? '$discountPercent% OFF' : 'NEW',
            'isPurchased': isPurchased,
            'image':
                course['thumbnail'] ??
                'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
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
      items:
          slides.map((slide) {
            return GestureDetector(
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CourseDetailsScreen(course: slide),
                  ),
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
                      CustomCachedImage(
                        imageUrl: slide['image'].toString(),
                        fit: BoxFit.cover,
                      ),
                      Container(color: Colors.black.withValues(alpha: 0.5)),
                      Stack(
                        children: [
                          if (slide['isPurchased'] == true)
                            Positioned(
                              top: 20,
                              right: 20,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppConstants.secondaryColor,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(
                                      Icons.check_circle,
                                      size: 12,
                                      color: Colors.white,
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      'Purchased',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            Positioned(
                              top: 20,
                              right: 20,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppConstants.accentColor,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  slide['discount_text'].toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),

                            Positioned(
                            bottom: 20,
                            left: 20,
                            right: 20,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Duration Badge
                                Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.6),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: Colors.white24, width: 0.5),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.access_time, color: Colors.white, size: 12),
                                      const SizedBox(width: 4),
                                      Text(
                                        _calculateDuration(slide),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10, 
                                          fontWeight: FontWeight.w500
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  slide['title'].toString(),
                                  style: const TextStyle(
                                    fontSize: 24.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    height: 1.1,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  slide['description'].toString(),
                                  style: const TextStyle(
                                    fontSize: 14.0,
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 16),
                                if (slide['isPurchased'] == true)
                                  _PulsingButton(
                                    onPressed: () async {
                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder:
                                              (context) =>
                                                  CourseDetailsScreen(
                                                    course: slide,
                                                  ),
                                        ),
                                      );
                                      if (onRefresh != null) onRefresh!();
                                    },
                                  )
                                else
                                  Row(
                                    children: [
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            slide['originalPrice_text']
                                                .toString(),
                                            style: const TextStyle(
                                              fontSize: 14.0,
                                              color: Colors.white54,
                                              decoration:
                                                  TextDecoration.lineThrough,
                                            ),
                                          ),
                                          Text(
                                            slide['price_text'].toString(),
                                            style: const TextStyle(
                                              fontSize: 22.0,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Spacer(),
                                      ElevatedButton(
                                        onPressed: () async {
                                          await Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder:
                                                  (context) =>
                                                      CourseDetailsScreen(
                                                        course: slide,
                                                      ),
                                            ),
                                          );
                                          if (onRefresh != null) onRefresh!();
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor:
                                              AppConstants.accentColor,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 24,
                                            vertical: 12,
                                          ),
                                        ),
                                        child: Text(
                                          (int.tryParse(
                                                    slide['price'].toString() ??
                                                        '0',
                                                  ) ??
                                                  0) <=
                                              0
                                              ? 'Enroll Now'
                                              : 'Buy Now',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
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
  String _calculateDuration(Map<String, dynamic> course) {
    // 1. Prioritize explicit text duration (e.g. "3 Months", "6 Weeks")
    if (course['duration'] != null && course['duration'].toString().isNotEmpty) {
       final durationStr = course['duration'].toString();
       if (durationStr.contains(RegExp(r'[a-zA-Z]'))) {
         return durationStr;
       }
    }

    int totalMinutes = 0;

    try {
      final sections = course['sections'] as List?;
      if (sections != null) {
        for (var section in sections) {
          final lectures = section['lectures'] as List?;
          if (lectures != null) {
            for (var lecture in lectures) {
              totalMinutes += _parseDuration(lecture['duration']);
            }
          }
        }
      } else {
         final materials = course['materials'] as List?;
         if (materials != null) {
            for (var material in materials) {
               totalMinutes += _parseDuration(material['duration']);
            }
         }
      }
      
      if (totalMinutes == 0 && course['duration'] != null) {
         totalMinutes = _parseDuration(course['duration']);
      }

      if (totalMinutes == 0) return 'Self Paced';

      final hours = totalMinutes ~/ 60;
      final minutes = totalMinutes % 60;

      if (hours > 0) {
        return '${hours}h ${minutes}m';
      }
      return '${minutes}m';
    } catch (e) {
      return 'Self Paced';
    }
  }

  int _parseDuration(dynamic duration) {
    if (duration == null) return 0;
    
    // If it's already a number (minutes or seconds? Assuming minutes for now based on context, or convert)
    if (duration is int) return duration;
    if (duration is double) return duration.toInt();

    if (duration is String) {
      // Handle "HH:MM:SS" or "MM:SS"
      final parts = duration.split(':');
      if (parts.length == 3) {
        return (int.parse(parts[0]) * 60) + int.parse(parts[1]);
      } else if (parts.length == 2) {
        return int.parse(parts[0]); // Treat MM:SS as minutes for simple display
      }
      // Handle "10 mins" etc
      final numeric = int.tryParse(duration.replaceAll(RegExp(r'[^0-9]'), ''));
      return numeric ?? 0;
    }
    return 0;
  }
}

class _PulsingButton extends StatefulWidget {
  final VoidCallback onPressed;

  const _PulsingButton({required this.onPressed});

  @override
  State<_PulsingButton> createState() => _PulsingButtonState();
}

class _PulsingButtonState extends State<_PulsingButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: _animation.value,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: LinearGradient(
                colors: [
                  AppConstants.primaryColor,
                  AppConstants.accentColor,
                  Colors.purple,
                  AppConstants.primaryColor,
                ],
                stops: [
                  (_animation.value - 1) * 12.5,
                  (_animation.value - 1) * 12.5 + 0.25,
                  (_animation.value - 1) * 12.5 + 0.5,
                  (_animation.value - 1) * 12.5 + 0.75,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            padding: const EdgeInsets.all(1),
            child: Container(
              decoration: BoxDecoration(
                color: AppConstants.primaryColor,
                borderRadius: BorderRadius.circular(11),
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(11),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Continue Learning',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

