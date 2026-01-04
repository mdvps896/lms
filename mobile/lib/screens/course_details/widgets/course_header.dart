import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../../../widgets/common/custom_cached_image.dart';

class CourseHeader extends StatelessWidget {
  final Map<String, dynamic> course;
  final int likesCount;
  final bool isLiked;
  final VoidCallback onLikeToggle;
  final VoidCallback onShowReviews;

  const CourseHeader({
    super.key, 
    required this.course,
    required this.likesCount,
    required this.isLiked,
    required this.onLikeToggle,
    required this.onShowReviews,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Course Image/Banner
        Container(
          height: 220,
          width: double.infinity,
          decoration: BoxDecoration(
            color: course['color'] ?? Colors.blueAccent,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(30),
              bottomRight: Radius.circular(30),
            ),
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(30),
              bottomRight: Radius.circular(30),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (course['thumbnail'] != null && course['thumbnail'].isNotEmpty)
                  CustomCachedImage(
                    imageUrl: course['thumbnail'],
                    fit: BoxFit.cover,
                  ),
                Container(
                  color: Colors.black.withOpacity(0.2), // Dark Overlay
                ),
                if (course['thumbnail'] == null || course['thumbnail'].isEmpty)
                  const Center(
                      child: Icon(Icons.image, size: 60, color: Colors.white54)),
              ],
            ),
          ),
        ),
        
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title
              Text(
                course['title'] ?? 'Course Title',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 16),
              
              // Instructor Row
              Row(
                children: [
                   // Avatar - Dynamic from backend
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey[200],
                    backgroundImage: _getInstructorImage(),
                  ),
                  const SizedBox(width: 12),
                  
                   // Name and Rating - Dynamic from backend
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getInstructorName(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: onShowReviews,
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, size: 16, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(
                                '${course['rating'] ?? '4.5'} Rating',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                              Container(
                                margin: const EdgeInsets.symmetric(horizontal: 8),
                                width: 1,
                                height: 12,
                                color: Colors.grey[300],
                              ),
                              Text(
                                course['language'] ?? 'English',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Like Button & Count (New Integrated UI)
                  InkWell(
                    onTap: onLikeToggle,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isLiked ? AppConstants.primaryColor.withOpacity(0.1) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isLiked ? AppConstants.primaryColor : Colors.transparent,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isLiked ? Icons.thumb_up_alt_rounded : Icons.thumb_up_off_alt_rounded,
                            size: 18,
                            color: isLiked ? AppConstants.primaryColor : Colors.grey[600],
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '$likesCount',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isLiked ? AppConstants.primaryColor : Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  ImageProvider _getInstructorImage() {
    try {
      if (course['instructor'] != null) {
        final instructor = course['instructor'];
        String? imageUrl;
        
        if (instructor is Map) {
          imageUrl = instructor['profileImage']?.toString() ?? 
                    instructor['profilePicture']?.toString();
        }
        
        if (imageUrl != null && imageUrl.isNotEmpty) {
          return NetworkImage(imageUrl);
        }
      }
    } catch (e) {
      print('Error loading instructor image: $e');
    }
    
    return const AssetImage('assets/logo.png') as ImageProvider;
  }

  String _getInstructorName() {
    try {
      if (course['instructor'] != null) {
        final instructor = course['instructor'];
        
        // Handle if instructor is a Map/Object
        if (instructor is Map) {
          final name = instructor['name']?.toString();
          if (name != null && name.isNotEmpty) {
            return name;
          }
        }
      }
    } catch (e) {
      print('❌ Error loading instructor name: $e');
    }
    
    // Temporary hardcoded fallback - should match admin name from settings
    return 'God of Graphics';
  }
}
