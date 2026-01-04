import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class CourseCurriculum extends StatelessWidget {
  const CourseCurriculum({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Course Content',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              Icon(Icons.more_horiz_rounded, color: Colors.grey[400]),
            ],
          ),
          const SizedBox(height: 16),
          
          // Section 1
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey[100]!),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Section 1 Introduction',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppConstants.textPrimary,
                        ),
                      ),
                      Text(
                        '6 lessons',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
                
                const Divider(height: 1),
                
                // Lessons
                _buildLessonItem(
                  'Welcome to the Course', 
                  '6 min', 
                  true, 
                  Icons.check_circle_rounded, 
                  Colors.green,
                ),
                _buildLessonItem(
                  'Basics of UI Design', 
                  '15 min', 
                  true, 
                  Icons.play_circle_fill_rounded, 
                  AppConstants.accentColor,
                  isActive: true, // Playing state styling
                ),
                _buildLessonItem(
                  'Understanding Color Theory', 
                  '12 min', 
                  false, 
                  Icons.lock_rounded, 
                  Colors.grey[400]!,
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildLessonItem(String title, String duration, bool isUnlocked, IconData icon, Color iconColor, {bool isActive = false}) {
    return Container(
      color: isActive ? AppConstants.accentColor.withOpacity(0.05) : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 22, color: iconColor),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? AppConstants.accentColor : AppConstants.textPrimary,
              ),
            ),
          ),
          if (isActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppConstants.accentColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Text('Continue', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                  SizedBox(width: 2),
                  Icon(Icons.play_arrow_rounded, size: 10, color: Colors.white),
                ],
              ),
            )
          else
            Text(
              duration,
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
        ],
      ),
    );
  }
}
