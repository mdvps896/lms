import 'package:flutter/material.dart';
import '../utils/constants.dart';

class CustomFooter extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomFooter({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppConstants.secondaryColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: onTap,
        backgroundColor: AppConstants.secondaryColor,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 10,
        ),
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        items: [
          _buildItem(Icons.home_rounded, 'Home', 0),
          _buildItem(Icons.auto_stories_rounded, 'Free Material', 1),
          _buildItem(Icons.book_rounded, 'My Courses', 2),
          _buildItem(Icons.headset_mic_rounded, 'Help', 3),
          _buildItem(Icons.menu_rounded, 'Menu', 4),
        ],
      ),
    );
  }

  BottomNavigationBarItem _buildItem(IconData icon, String label, int index) {
    return BottomNavigationBarItem(
      icon: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.all(currentIndex == index ? 8 : 0),
        decoration:
            currentIndex == index
                ? BoxDecoration(
                  color: AppConstants.primaryColor,
                  shape: BoxShape.circle,
                )
                : null,
        child: Icon(icon, size: currentIndex == index ? 26 : 24),
      ),
      label: label,
    );
  }
}
