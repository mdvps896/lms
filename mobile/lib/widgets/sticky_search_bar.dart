import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../screens/search_screen.dart';

class StickySearchBar extends StatelessWidget {
  const StickySearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppConstants.secondaryColor,
      child: Container(
         decoration: const BoxDecoration(
          color: AppConstants.secondaryColor,
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(30),
          ),
        ),
        padding: const EdgeInsets.only(left: 20, right: 20, top: 0, bottom: 15),
        child: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SearchScreen()),
            );
          },
          child: Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.search,
                  color: Colors.white.withValues(alpha: 0.9),
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'What do you want to learn?',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
