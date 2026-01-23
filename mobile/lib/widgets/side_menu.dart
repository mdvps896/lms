import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/user_model.dart';
import '../utils/constants.dart';
import '../services/api_service.dart';
import '../screens/login_screen.dart';
import '../screens/results/my_results_screen.dart';
import '../screens/profile/profile_page.dart';
import '../screens/notification_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/help/help_info_screen.dart';
import '../screens/legal/legal_tabs_screen.dart';
import 'common/custom_cached_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class SideMenu extends StatefulWidget {
  final User user;
  final Function(int)? onTabChange;

  const SideMenu({super.key, required this.user, this.onTabChange});

  @override
  State<SideMenu> createState() => _SideMenuState();
}

class _SideMenuState extends State<SideMenu> {
  final ApiService _apiService = ApiService();
  List<dynamic> _socialLinks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  Future<void> _fetchSettings() async {
    final settings = await _apiService.getSettings();
    if (settings != null && settings['socialMediaLinks'] != null) {
      if (mounted) {
        setState(() {
          _socialLinks = List<dynamic>.from(settings['socialMediaLinks'])
              .where((link) => link['enabled'] == true)
              .toList();
          _isLoading = false;
        });
      }
    } else {
       if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // Header with User Info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(
              top: 50,
              bottom: 20,
              left: 20,
              right: 20,
            ),
            decoration: const BoxDecoration(
              color: AppConstants.secondaryColor,
              borderRadius: BorderRadius.only(bottomRight: Radius.circular(30)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: CircleAvatar(
                    radius: 35,
                    backgroundColor: Colors.grey[200],
                    child:
                        widget.user.profileImage != null
                            ? ClipOval(
                              child: CustomCachedImage(
                                imageUrl: ApiService().getFullUrl(
                                  widget.user.profileImage,
                                ),
                                width: 70,
                                height: 70,
                                fit: BoxFit.cover,
                              ),
                            )
                            : Text(
                              widget.user.name[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 30,
                                fontWeight: FontWeight.bold,
                                color: AppConstants.secondaryColor,
                              ),
                            ),
                  ),
                ),
                const SizedBox(height: 15),
                const Text(
                  'Welcome,',
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
                Text(
                  widget.user.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 5),
                // Real Roll Number from user model
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Roll No: ${widget.user.rollNumber ?? "N/A"}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Menu Items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 10),
              children: [
                _buildMenuItem(Icons.person_outline, 'My Profile', () {
                  Navigator.pop(context); // Close drawer
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ProfilePage(),
                    ),
                  );
                }),
                _buildMenuItem(Icons.book_outlined, 'My Courses', () {
                  Navigator.pop(context); // Close drawer
                  if (widget.onTabChange != null) {
                    widget.onTabChange!(2); // Switch to My Courses tab (index 2)
                  }
                }),
                _buildMenuItem(
                  Icons.assignment_turned_in_outlined,
                  'Results',
                  () {
                    Navigator.pop(context); // Close drawer
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyResultsScreen(),
                      ),
                    );
                  },
                ),
                _buildMenuItem(
                  Icons.notifications_none_outlined,
                  'Notifications',
                  () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const NotificationScreen(),
                      ),
                    );
                  },
                ),
                _buildMenuItem(Icons.settings_outlined, 'Settings', () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SettingsScreen(),
                    ),
                  );
                }),
                _buildMenuItem(Icons.help_outline, 'Help & Support', () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const HelpInfoScreen(),
                    ),
                  );
                }),
                const Divider(),
                _buildMenuItem(Icons.info_outline, 'About Us', () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder:
                          (context) => const LegalTabsScreen(initialIndex: 0),
                    ),
                  );
                }),
                _buildMenuItem(
                  Icons.privacy_tip_outlined,
                  'Privacy Policy',
                  () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder:
                            (context) => const LegalTabsScreen(initialIndex: 1),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          // Social Media & Logout
          Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Social Icons
                if (!_isLoading) ...[
                  _socialLinks.isEmpty 
                  ? const SizedBox()
                  : SizedBox(
                      height: 50,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        shrinkWrap: true,
                        itemCount: _socialLinks.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 15),
                        itemBuilder: (context, index) {
                          final link = _socialLinks[index];
                          return _buildSocialIcon(
                            _getIconData(link['platform']),
                            _getIconColor(link['platform']),
                            link['url'],
                          );
                        },
                      ),
                    ),
                ],
                const SizedBox(height: 20),

                // Logout Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final apiService = ApiService();
                      await apiService.logout();
                      if (context.mounted) {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const LoginScreen(),
                          ),
                          (route) => false,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.secondaryColor.withValues(alpha: 0.1),
                      foregroundColor: AppConstants.secondaryColor,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.logout),
                        SizedBox(width: 8),
                        Text(
                          'Logout',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppConstants.textSecondary),
      title: Text(
        title,
        style: const TextStyle(
          color: AppConstants.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios,
        size: 14,
        color: Colors.grey,
      ),
      onTap: onTap,
    );
  }

  Widget _buildSocialIcon(IconData icon, Color color, String url) {
    return InkWell(
      onTap: () async {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        }
      },
      borderRadius: BorderRadius.circular(25),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }


  IconData _getIconData(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook': return FontAwesomeIcons.facebook;
      case 'instagram': return FontAwesomeIcons.instagram;
      case 'twitter': return FontAwesomeIcons.xTwitter; // Modern X logo
      case 'linkedin': return FontAwesomeIcons.linkedin;
      case 'youtube': return FontAwesomeIcons.youtube;
      case 'whatsapp': return FontAwesomeIcons.whatsapp;
      case 'telegram': return FontAwesomeIcons.telegram;
      case 'website': return FontAwesomeIcons.globe;
      case 'tiktok': return FontAwesomeIcons.tiktok;
      case 'snapchat': return FontAwesomeIcons.snapchat;
      case 'pinterest': return FontAwesomeIcons.pinterest;
      default: return FontAwesomeIcons.link;
    }
  }

  Color _getIconColor(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook': return const Color(0xFF1877F2);
      case 'instagram': return const Color(0xFFE4405F);
      case 'twitter': return Colors.black; // X is black
      case 'linkedin': return const Color(0xFF0A66C2);
      case 'youtube': return const Color(0xFFFF0000);
      case 'whatsapp': return const Color(0xFF25D366);
      case 'telegram': return const Color(0xFF0088CC);
      case 'tiktok': return Colors.black;
      case 'snapchat': return const Color(0xFFFFFC00);
      case 'pinterest': return const Color(0xFFBD081C);
      default: return AppConstants.primaryColor;
    }
  }
}
