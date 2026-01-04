import 'package:flutter/material.dart';

class CourseStats extends StatelessWidget {
  final Map<String, dynamic> course;
  
  const CourseStats({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    // Safe type conversion
    int safeInt(dynamic value, [int defaultValue = 0]) {
      if (value == null) return defaultValue;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? defaultValue;
      if (value is Map) return defaultValue;
      return defaultValue;
    }

    // Get real data from course
    final int totalLectures = safeInt(course['totalLectures'], 24);
    final int totalQuizzes = safeInt(course['totalQuizzes'], 8);
    final bool hasCertificate = course['hasCertificate'] == true;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStatItem(Icons.play_circle_fill_rounded, '$totalLectures Lessons', Colors.redAccent),
          _buildDivider(),
          _buildStatItem(Icons.quiz_rounded, '$totalQuizzes Quizzes', Colors.amber),
          _buildDivider(),
          _buildStatItem(
            Icons.card_membership_rounded, 
            hasCertificate ? 'Certificate' : 'No Certificate', 
            hasCertificate ? Colors.blue : Colors.grey
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String label, Color color) {
    return Expanded(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 24,
      color: Colors.grey[200],
    );
  }
}
