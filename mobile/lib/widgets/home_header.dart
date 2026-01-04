import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../utils/constants.dart';
import '../screens/notification_screen.dart';
import '../screens/profile/profile_page.dart';
import 'common/custom_cached_image.dart';

import '../services/api_service.dart';

class HomeHeader extends StatelessWidget {
  final User user;

  const HomeHeader({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final String? profileImageUrl = user.profileImage != null ? ApiService.getFullUrl(user.profileImage) : null;
    
    return Container(
      color: AppConstants.primaryColor.withOpacity(0.04), // Subtle premium tint
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      child: Row(
        children: [
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
                border: Border.all(color: AppConstants.primaryColor, width: 2),
              ),
              child: CircleAvatar(
                radius: 24,
                backgroundColor: Colors.white,
                child: profileImageUrl != null && profileImageUrl.isNotEmpty
                    ? ClipOval(
                        child: CustomCachedImage(
                          imageUrl: profileImageUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                        ),
                      )
                    : Text(
                        user.name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.primaryColor,
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textPrimary,
                  ),
                ),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        'Find your course & enjoy ',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppConstants.textSecondary,
                        ),
                      ),
                    ),
                    const Icon(Icons.auto_awesome, size: 12, color: AppConstants.accentColor),
                  ],
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: AppConstants.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
