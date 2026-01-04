import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../screens/free_materials/free_materials_screen.dart';

class FreeMaterialGrid extends StatelessWidget {
  const FreeMaterialGrid({super.key});

  @override
  Widget build(BuildContext context) {
    // 4 Static Best Cards with tab indices
    final List<Map<String, dynamic>> materials = [
      {
        'title': 'Free Video Material',
        'icon': Icons.play_circle_fill_rounded,
        'color': const Color(0xFFFF6B6B), // Red/Coral
        'count': '120+ Videos',
        'tabIndex': 1, // Videos tab
      },
      {
        'title': 'Free PDF Notes',
        'icon': Icons.picture_as_pdf_rounded,
        'color': const Color(0xFF4ECDC4), // Teal
        'count': '500+ Files',
        'tabIndex': 0, // Documents tab
      },
      {
        'title': 'Google Meet Classes',
        'icon': Icons.video_camera_front_rounded,
        'color': const Color(0xFF1A535C), // Dark Teal/Blue
        'count': 'Live Daily',
        'tabIndex': 3, // Meetings tab
      },
      {
        'title': 'Documents & Downloads',
        'icon': Icons.folder_zip_rounded,
        'color': const Color(0xFFFFB400), // Yellow
        'count': 'Unlimited',
        'tabIndex': 0, // Documents tab
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _buildCard(context, materials[0])),
              const SizedBox(width: 16),
              Expanded(child: _buildCard(context, materials[1])),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildCard(context, materials[2])),
              const SizedBox(width: 16),
              Expanded(child: _buildCard(context, materials[3])),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCard(BuildContext context, Map<String, dynamic> item) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FreeMaterialsScreen(
              initialTabIndex: item['tabIndex'] ?? 0,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        height: 140,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: item['color'].withOpacity(0.1),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: item['color'].withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: item['color'].withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(item['icon'], color: item['color'], size: 24),
            ),
            const Spacer(),
            Text(
              item['title'],
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              item['count'],
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: item['color'],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
