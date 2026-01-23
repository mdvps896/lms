import 'package:flutter/material.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import '../models/user_model.dart';
import '../utils/constants.dart';
import '../screens/notification_screen.dart';
import '../screens/profile/profile_page.dart';
import '../screens/search_screen.dart';
import 'common/custom_cached_image.dart';

import '../services/api_service.dart';

class HomeHeader extends StatelessWidget {
  final User user;

  const HomeHeader({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final String? profileImageUrl =
        user.profileImage != null
            ? ApiService().getFullUrl(user.profileImage)
            : null;

    return Container(
      decoration: const BoxDecoration(
        color: AppConstants.secondaryColor,
        borderRadius: BorderRadius.vertical(
          bottom: Radius.circular(30),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 8,
        16,
        24,
      ),
      child: Row(
        children: [
          // Profile Icon
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfilePage()),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.white,
                child:
                    profileImageUrl != null && profileImageUrl.isNotEmpty
                        ? ClipOval(
                          child: CustomCachedImage(
                            imageUrl: profileImageUrl,
                            width: 36,
                            height: 36,
                            fit: BoxFit.cover,
                          ),
                        )
                        : Text(
                          user.name.substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.primaryColor,
                          ),
                        ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Search Bar
          Expanded(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SearchScreen()),
                );
              },
              child: Container(
                height: 42,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(21),
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
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DefaultTextStyle(
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                        child: AnimatedTextKit(
                          repeatForever: true,
                          pause: const Duration(milliseconds: 2000),
                          animatedTexts: [
                            TypewriterAnimatedText('What do you want to learn?'),
                            TypewriterAnimatedText('Search for courses...'),
                            TypewriterAnimatedText('Find free materials...'),
                            TypewriterAnimatedText('Explore live exams...'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Notification Icon
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const NotificationScreen(),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
