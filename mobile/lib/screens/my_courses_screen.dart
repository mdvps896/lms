import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import 'course_details/course_details_screen.dart';
import '../widgets/common/custom_cached_image.dart';

import '../models/user_model.dart';

class MyCoursesScreen extends StatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  State<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends State<MyCoursesScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _courses = [];
  User? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final courses = await _apiService.getMyCourses();
    final user = await _apiService.getSavedUser();
    
    if (mounted) {
      setState(() {
        _courses = courses;
        _user = user;
        _isLoading = false;
      });
    }
  }

  int _readingDurationToSeconds(dynamic readingDuration) {
    if (readingDuration == null) return 0;
    if (readingDuration is Map) {
      final value = int.tryParse(readingDuration['value']?.toString() ?? '0') ?? 0;
      final unit = readingDuration['unit']?.toString() ?? 'hours';
      if (unit == 'minutes') return value * 60;
      if (unit == 'hours') return value * 3600;
      if (unit == 'days') return value * 86400;
      if (unit == 'months') return value * 2592000;
    }
    return 0;
  }

  double _calculateProgress(Map<String, dynamic> course) {
    double progress = 0.0;
    
    // 1. Time-based Progress (Priority)
    final totalSecondsSpent = int.tryParse(course['totalTimeSpent']?.toString() ?? '0') ?? 0;
    final targetSeconds = _readingDurationToSeconds(course['readingDuration']);
    
    if (targetSeconds > 0) {
      progress = (totalSecondsSpent / targetSeconds).clamp(0.0, 1.0);
      return progress;
    }

    // 2. Lecture-based Progress (Fallback)
    // Try from course object directly
    if (course['totalLectures'] != null) {
      final total = int.tryParse(course['totalLectures'].toString()) ?? 0;
      final completed = (course['completedLectures'] as List?)?.length ?? 0;
      if (total > 0 && completed > 0) {
        return (completed / total).clamp(0.0, 1.0);
      }
    }
    
    // 3. Robust Fallback: Check local user enrollment data
    // This handles cases where my-courses API returns incomplete data but user profile has it
    if (_user != null && _user!.enrolledCourses != null) {
      final courseId = course['_id'] ?? course['id'];
      try {
        final enrollment = _user!.enrolledCourses!.firstWhere(
          (e) {
            String? eId;
            if (e is Map) {
              eId = e['courseId']?.toString() ?? e['course']?.toString();
            } else {
              eId = e.toString();
            }
            return eId == courseId;
          },
          orElse: () => null,
        );

        if (enrollment is Map) {
          // Check for time-based in enrollment if missing in course object
          if (progress == 0.0) {
             final timeSpent = int.tryParse(enrollment['totalTimeSpent']?.toString() ?? '0') ?? 0;
             if (targetSeconds > 0 && timeSpent > 0) {
               return (timeSpent / targetSeconds).clamp(0.0, 1.0);
             }
          }

          // Check for lecture-based in enrollment
          if (enrollment['completedLectures'] is List) {
            final total = int.tryParse(course['totalLectures']?.toString() ?? '0') ?? 0;
            final completed = (enrollment['completedLectures'] as List).length;
            if (total > 0) {
              return (completed / total).clamp(0.0, 1.0);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Courses',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        automaticallyImplyLeading: false, 
      ),
      backgroundColor: AppConstants.backgroundColor,
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _courses.isEmpty
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.book_outlined,
                      size: 80,
                      color: Colors.grey[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No active courses found',
                      style: TextStyle(color: Colors.grey[600], fontSize: 16),
                    ),
                  ],
                ),
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _courses.length,
                itemBuilder: (context, index) {
                  final course = _courses[index];
                  final isExpired = course['isExpired'] == true;
                  final progress = _calculateProgress(course);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.grey[200]!,
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
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder:
                                (context) =>
                                    CourseDetailsScreen(course: course),
                          ),
                        ).then((_) => _loadData()); // Refresh on return
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Course Image and Status Badge
                          Stack(
                            children: [
                              ClipRRect(
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(16),
                                  topRight: Radius.circular(16),
                                ),
                                child: CustomCachedImage(
                                  imageUrl: course['thumbnail'] ?? '',
                                  width: double.infinity,
                                  height: 180,
                                  fit: BoxFit.cover,
                                  errorWidget: Container(
                                    width: double.infinity,
                                    height: 180,
                                    color: AppConstants.primaryColor,
                                    child: const Icon(
                                      Icons.book_rounded,
                                      size: 60,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              // Dark overlay
                              Container(
                                height: 180,
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(16),
                                    topRight: Radius.circular(16),
                                  ),
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.black.withValues(alpha: 0.3),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),
                              // Status Badge
                              Positioned(
                                top: 12,
                                right: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isExpired
                                        ? Colors.red
                                        : Colors.green,
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: [
                                      BoxShadow(
                                        color: (isExpired ? Colors.red : Colors.green)
                                            .withValues(alpha: 0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        isExpired
                                            ? Icons.lock_clock
                                            : Icons.check_circle,
                                        size: 14,
                                        color: Colors.white,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isExpired ? 'Expired' : 'Active',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          
                          // Course Details
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  course['title'] ?? 'Untitled Course',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: Color(0xFF2D3436),
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 12),
                                
                                // Progress Bar
                                if (!isExpired) ...[
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Progress',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        '${(progress * 100).toInt()}%',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppConstants.primaryColor,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: LinearProgressIndicator(
                                      value: progress,
                                      minHeight: 8,
                                      backgroundColor: Colors.grey[200],
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        AppConstants.primaryColor,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                
                                // Continue Learning Button
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder:
                                              (context) =>
                                                  CourseDetailsScreen(course: course),
                                        ),
                                      ).then((_) => _loadData());
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: isExpired
                                          ? Colors.grey
                                          : AppConstants.primaryColor,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      elevation: 0,
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          isExpired
                                              ? Icons.lock
                                              : Icons.play_circle_outline,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          isExpired ? 'Renew Course' : 'Continue Learning',
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
