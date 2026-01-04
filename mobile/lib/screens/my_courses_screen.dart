import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import 'course_details/course_details_screen.dart';
import '../widgets/common/custom_cached_image.dart';

class MyCoursesScreen extends StatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  State<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends State<MyCoursesScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    final courses = await _apiService.getMyCourses();
    if (mounted) {
      setState(() {
        _courses = courses;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
            title: const Text('My Courses', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            backgroundColor: Colors.white,
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.black),
            automaticallyImplyLeading: false, // Don't show back button if in tabs
        ),
        backgroundColor: AppConstants.backgroundColor,
        body: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : _courses.isEmpty
                ? Center(
                    child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                            Icon(Icons.book_outlined, size: 80, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text(
                              'No active courses found', 
                              style: TextStyle(color: Colors.grey[600], fontSize: 16)
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: () {
                                // Navigate to home usually, but this is a tab.
                              },
                              child: const Text('Browse Courses'),
                            )
                        ],
                    ),
                )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _courses.length,
                    itemBuilder: (context, index) {
                        final course = _courses[index];
                        final isExpired = course['isExpired'] == true;
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: InkWell(
                                onTap: () {
                                    Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (context) => CourseDetailsScreen(course: course),
                                        ),
                                    );
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                        children: [
                                            // Thumbnail
                                            ClipRRect(
                                                borderRadius: BorderRadius.circular(8),
                                                child: CustomCachedImage(
                                                    imageUrl: course['thumbnail'] ?? '',
                                                    width: 80,
                                                    height: 80,
                                                    fit: BoxFit.cover,
                                                    errorWidget: Container(width: 80, height: 80, color: Colors.grey[200], child: const Icon(Icons.image)),
                                                ),
                                            ),
                                            const SizedBox(width: 16),
                                            // Details
                                            Expanded(
                                                child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                        Text(
                                                            course['title'] ?? 'Untitled Course',
                                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                                            maxLines: 2,
                                                            overflow: TextOverflow.ellipsis,
                                                        ),
                                                        const SizedBox(height: 8),
                                                        if (isExpired)
                                                            Container(
                                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                                decoration: BoxDecoration(
                                                                  color: Colors.red[50], 
                                                                  borderRadius: BorderRadius.circular(4),
                                                                  border: Border.all(color: Colors.red[100]!)
                                                                ),
                                                                child: const Text('Expired', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                                                            )
                                                        else
                                                             Container(
                                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                                decoration: BoxDecoration(
                                                                  color: Colors.green[50], 
                                                                  borderRadius: BorderRadius.circular(4),
                                                                  border: Border.all(color: Colors.green[200]!)
                                                                ),
                                                                child: const Text('Active', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                                            ),
                                                    ],
                                                ),
                                            ),
                                            const Icon(Icons.chevron_right, color: Colors.grey),
                                        ],
                                    ),
                                ),
                            ),
                        );
                    },
                ),
    );
  }
}
