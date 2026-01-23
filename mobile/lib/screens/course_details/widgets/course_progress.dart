import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class CourseProgress extends StatelessWidget {
  final double progress; // 0.0 to 1.0

  const CourseProgress({super.key, required this.progress});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "What's included",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              Row(
                children: [
                  Text(
                    'Expand All',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey[100],
                  color: AppConstants.accentColor, // Orange
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                  children: [
                    TextSpan(
                      text: '${(progress * 100).toInt()}% ',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppConstants.accentColor,
                      ),
                    ),
                    const TextSpan(text: 'Complete'),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
