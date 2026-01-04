import 'package:flutter/material.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import '../utils/constants.dart';
import '../screens/search_screen.dart';

class StickySearchBar extends SliverPersistentHeaderDelegate {
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white, // Or Header Color if you want it to blend
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      alignment: Alignment.center,
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const SearchScreen()),
          );
        },
        child: Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6), // Very light grey
            borderRadius: BorderRadius.circular(25), // Fully rounded
            border: Border.all(color: Colors.grey.withOpacity(0.1)),
             boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.search, color: AppConstants.primaryColor),
              const SizedBox(width: 12),
              Expanded(
                child: DefaultTextStyle(
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                    fontFamily: 'Roboto',
                  ),
                  child: AnimatedTextKit(
                    repeatForever: true,
                    pause: const Duration(milliseconds: 2000),
                    animatedTexts: [
                      TypewriterAnimatedText('Search for courses...'),
                      TypewriterAnimatedText('Find free materials...'),
                      TypewriterAnimatedText('Explore live exams...'),
                    ],
                    onTap: () {
                       Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SearchScreen()),
                      );
                    },
                  ),
                ),
              ),
              Container(
                 padding: const EdgeInsets.all(6),
                 decoration: const BoxDecoration(
                   color: AppConstants.accentColor, // Gold/Yellow Filter
                   shape: BoxShape.circle,
                 ),
                 child: const Icon(
                   Icons.tune_rounded, // Filter icon
                   color: Colors.black,
                   size: 16,
                 ),
               ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  double get maxExtent => 70.0;

  @override
  double get minExtent => 70.0;

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) {
    return false;
  }
}
