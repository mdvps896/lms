import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class CourseActionButtons extends StatelessWidget {
  final bool isPurchased;

  const CourseActionButtons({super.key, required this.isPurchased});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.accentColor, // Orange/Gold
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shadowColor: AppConstants.accentColor.withOpacity(0.4),
                elevation: 8,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                isPurchased ? 'Start Learning' : 'Enroll Now',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          _buildIconBtn(Icons.favorite_border_rounded),
          const SizedBox(width: 12),
          _buildIconBtn(Icons.more_horiz_rounded),
        ],
      ),
    );
  }

  Widget _buildIconBtn(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Icon(icon, color: Colors.grey[700]),
    );
  }
}
