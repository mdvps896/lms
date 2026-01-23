import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/user_model.dart';
import '../../utils/constants.dart';
import '../../widgets/course_slider.dart';
import '../../widgets/continue_learning_card.dart';
import '../../widgets/free_material_grid.dart';
import '../../widgets/section_title.dart';
import '../../widgets/category_list.dart';
import '../../widgets/category_course_grid.dart';
import '../category_courses_page.dart';
import '../course_details/course_details_screen.dart';

class HomeBody extends StatefulWidget {
  final User user;
  final List<Map<String, dynamic>> courses;
  final List<Map<String, dynamic>> myCourses;
  final List<Map<String, dynamic>> categories;
  final Future<void> Function() onRefresh;

  const HomeBody({
    super.key,
    required this.user,
    required this.courses,
    required this.myCourses,
    required this.categories,
    required this.onRefresh,
  });

  @override
  State<HomeBody> createState() => _HomeBodyState();
}

class _HomeBodyState extends State<HomeBody> {
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

  List<Map<String, dynamic>> _buildContinueLearningItems() {
    final List<Map<String, dynamic>> continueLearningItems = [];

    for (var course in widget.myCourses) {
      final courseId = course['_id'] ?? course['id'];
      if (courseId == null) continue;

      String categoryName = 'Learning';
      if (course['category'] is Map) {
        categoryName = course['category']['name'] ?? 'Learning';
      } else if (course['category'] is String) {
        categoryName = course['category'];
      }

      // Lookup full course details from widget.courses if possible
      var fullCourse = widget.courses.firstWhere(
        (c) => (c['_id'] == courseId || c['id'] == courseId),
        orElse: () => {},
      );

      // Calculate progress
      double progress = 0.0;
      final totalSecondsSpent = int.tryParse(course['totalTimeSpent']?.toString() ?? '0') ?? 0;
      final targetSeconds = _readingDurationToSeconds(course['readingDuration']);
      
      if (targetSeconds > 0) {
        progress = (totalSecondsSpent / targetSeconds).clamp(0.0, 1.0);
      } else {
        // Fallback: Calculate from lectures
        int totalLectures = 0;
        if (course['totalLectures'] != null) {
          totalLectures = int.tryParse(course['totalLectures'].toString()) ?? 0;
        }
        if (totalLectures == 0 &&
            fullCourse.isNotEmpty &&
            fullCourse['totalLectures'] != null) {
          totalLectures = int.tryParse(fullCourse['totalLectures'].toString()) ?? 0;
        }

        // Fallback: Calculate from sections (check both myCourse and fullCourse)
        if (totalLectures == 0) {
          List? sections;
          if (course['sections'] is List) {
            sections = course['sections'];
          } else if (fullCourse.isNotEmpty && fullCourse['sections'] is List) {
            sections = fullCourse['sections'];
          }

          if (sections != null) {
            try {
              for (var section in sections) {
                if (section['lectures'] is List) {
                  totalLectures += (section['lectures'] as List).length;
                }
              }
            } catch (e) {
              debugPrint('Error counting lectures: $e');
            }
          }
        }

        var completedLectures = course['completedLectures'] as List?;

        // Fallback: Check user.enrolledCourses if completedLectures is missing/empty
        if ((completedLectures == null || completedLectures.isEmpty) &&
            widget.user.enrolledCourses != null) {
          try {
            final enrollment = widget.user.enrolledCourses!.firstWhere(
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

            if (enrollment is Map && enrollment['completedLectures'] is List) {
              completedLectures = enrollment['completedLectures'];
            }
          } catch (e) {
            // ignore
          }
        }

        if (totalLectures > 0 &&
            completedLectures != null &&
            completedLectures.isNotEmpty) {
          progress = (completedLectures.length / totalLectures).clamp(0.0, 1.0);
        }
      }

      continueLearningItems.add({
        'courseId': courseId,
        'title': course['title'] ?? 'Course',
        'subtitle': categoryName,
        'progress': progress,
        'color': _getCourseColor(continueLearningItems.length),
        'icon': Icons.play_circle_outline,
        'thumbnail': course['thumbnail'],
        'duration': _formatReadingDuration(course['readingDuration']),
      });
    }

    // Fallback: If myCourses failed/empty, try user.enrolledCourses
    if (continueLearningItems.isEmpty && widget.user.enrolledCourses != null) {
      for (var enrollment in widget.user.enrolledCourses!) {
        String? courseId;

        if (enrollment is Map) {
          courseId =
              enrollment['courseId']?.toString() ?? enrollment['course']?.toString();
        } else if (enrollment is String) {
          courseId = enrollment;
        }

        if (courseId == null || courseId.isEmpty) continue;

        // Check if already added (avoid duplicates if myCourses had partial data)
        if (continueLearningItems.any((item) => item['courseId'] == courseId)) {
          continue;
        }

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

          // Fallback progress (likely 0 or partial if available in enrollment map)
          double progress = 0.0;
          if (enrollment is Map) {
            final totalLectures =
                int.tryParse(course['totalLectures']?.toString() ?? '0') ?? 0;
            final completed = enrollment['completedLectures'] as List?;
            if (totalLectures > 0 && completed != null) {
              progress = (completed.length / totalLectures).clamp(0.0, 1.0);
            }
          }

          continueLearningItems.add({
            'courseId': courseId,
            'title': course['title'] ?? 'Course',
            'subtitle': categoryName,
            'progress': progress,
            'color': _getCourseColor(continueLearningItems.length),
            'icon': Icons.play_circle_outline,
            'thumbnail': course['thumbnail'],
            'duration': _formatReadingDuration(course['readingDuration']),
          });
        }
      }
    }

    // Sort by progress (highest first), then by title
    continueLearningItems.sort((a, b) {
      final progressA = a['progress'] as double;
      final progressB = b['progress'] as double;

      // If progress is different, sort by progress (descending)
      if (progressA != progressB) {
        return progressB.compareTo(progressA);
      }

      // If progress is same, sort by title
      return (a['title'] as String).compareTo(b['title'] as String);
    });

    return continueLearningItems;
  }

  String _calculateCourseContentDuration(Map<String, dynamic> course) {
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

      if (totalMinutes == 0) {
        return _formatGenericDuration(course['duration']);
      }

      final hours = totalMinutes ~/ 60;
      final minutes = totalMinutes % 60;

      if (hours > 0) {
        return '${hours}h ${minutes}m';
      }
      return '${minutes}m';
    } catch (e) {
      return _formatGenericDuration(course['duration']);
    }
  }

  String _formatGenericDuration(dynamic duration) {
    if (duration == null) return '';
    if (duration is Map) {
      return '${duration['value']} ${duration['unit']}';
    }
    return duration.toString();
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

  String _formatReadingDuration(dynamic readingDuration) {
    if (readingDuration == null) return 'Not set';
    if (readingDuration is Map) {
      return '${readingDuration['value']} ${readingDuration['unit']}';
    }
    return readingDuration.toString();
  }

  int _parseDuration(dynamic duration) {
    if (duration == null) return 0;
    if (duration is int) return duration;
    if (duration is double) return duration.toInt();
    if (duration is String) {
      final parts = duration.split(':');
      if (parts.length == 3) {
        return (int.parse(parts[0]) * 60) + int.parse(parts[1]);
      } else if (parts.length == 2) {
        return int.parse(parts[0]);
      }
      final numeric = int.tryParse(duration.replaceAll(RegExp(r'[^0-9]'), ''));
      return numeric ?? 0;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final continueLearningItems = _buildContinueLearningItems();

    return Column(
      children: [
        const SizedBox(height: 10),

        // 1. Main Course Slider (Hero Section)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 5.0),
          child: CourseSlider(
            exams: widget.courses,
            user: widget.user,
            onRefresh: widget.onRefresh,
          ),
        ),

        const SizedBox(height: 24),

        // 2. Continue Learning Section
        if (continueLearningItems.isNotEmpty) ...[
          const SectionTitle(title: 'Continue Learning'),
          const SizedBox(height: 12),
          
          // If only 1 course, show full width. Otherwise, horizontal scroll
          if (continueLearningItems.length == 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: SizedBox(
                height: 180,
                child: GestureDetector(
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CourseDetailsScreen(
                          courseId: continueLearningItems[0]['courseId'],
                        ),
                      ),
                    );
                    await widget.onRefresh();
                  },
                  child: ContinueLearningCard(
                    title: continueLearningItems[0]['title'],
                    subtitle: continueLearningItems[0]['subtitle'],
                    progress: continueLearningItems[0]['progress'],
                    color: continueLearningItems[0]['color'],
                    icon: continueLearningItems[0]['icon'],
                    courseId: continueLearningItems[0]['courseId'],
                    duration: continueLearningItems[0]['duration'],
                  ),
                ),
              ),
            )
          else
            SizedBox(
              height: 180,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                itemCount: continueLearningItems.length,
                itemBuilder: (context, index) {
                  final item = continueLearningItems[index];
                  return GestureDetector(
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CourseDetailsScreen(
                            courseId: item['courseId'],
                          ),
                        ),
                      );
                      await widget.onRefresh();
                    },
                    child: SizedBox(
                      width: 280,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: ContinueLearningCard(
                          title: item['title'],
                          subtitle: item['subtitle'],
                          progress: item['progress'],
                          color: item['color'],
                          icon: item['icon'],
                          courseId: item['courseId'],
                          duration: item['duration'],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 24),
        ],

        // 3. Free Materials Section
        const SectionTitle(title: 'Free Materials'),
        const SizedBox(height: 12),
        FreeMaterialGrid(),

        const SizedBox(height: 24),

        // 4. Category List
        CategoryList(
          categories: widget.categories,
          onCategorySelected: (category) {
            setState(() {
              _selectedCategory = category;
            });
          },
        ),

        const SizedBox(height: 16),

        // 5. Course Grid
        CategoryCourseGrid(
          selectedCategory: _selectedCategory,
          courses: widget.courses,
          user: widget.user,
          onRefresh: widget.onRefresh,
        ),

        const SizedBox(height: 16),

        // 6. View All Courses Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CategoryCoursesPage(
                      categoryName: 'All Courses',
                      courses: widget.courses,
                      categories: widget.categories,
                      user: widget.user,
                      onRefresh: widget.onRefresh,
                    ),
                  ),
                );
              },
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: AppConstants.primaryColor,
                  width: 2,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                ),
              ),
              child: const Text(
                'View All Courses',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.primaryColor,
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 30),

        // 7. Developer Footer
        const SizedBox(height: 20),
        Center(
          child: GestureDetector(
            onTap: () async {
              const url = 'https://hinguland.com';
              if (await canLaunchUrl(Uri.parse(url))) {
                await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
              }
            },
            child: RichText(
              text: const TextSpan(
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
                children: [
                  TextSpan(text: 'Developed by '),
                  TextSpan(
                    text: 'Hinguland',
                    style: TextStyle(
                      color: AppConstants.primaryColor,
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }
}
