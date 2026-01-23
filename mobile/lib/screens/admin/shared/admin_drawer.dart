import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../utils/constants.dart';
import '../../login_screen.dart';
import '../students/students_list_screen.dart';
import '../courses/courses_list_screen.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: Colors.white,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            FutureBuilder(
              future: ApiService().getSavedUser(),
              builder: (context, snapshot) {
                if (snapshot.hasData && snapshot.data != null) {
                  final user = snapshot.data!;
                  return UserAccountsDrawerHeader(
                    decoration: BoxDecoration(
                      color: AppConstants.primaryColor,
                    ),
                    currentAccountPicture: CircleAvatar(
                      backgroundColor: Colors.white,
                      backgroundImage: user.profileImage != null
                          ? NetworkImage(user.profileImage!)
                          : null,
                      child: user.profileImage == null
                          ? Text(
                              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'A',
                              style: TextStyle(
                                fontSize: 32,
                                color: AppConstants.primaryColor,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    accountName: Text(
                      user.name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    accountEmail: Text(user.email),
                  );
                }
                return const DrawerHeader(
                  decoration: BoxDecoration(color: Colors.blue),
                  child: Text('Admin Panel'),
                );
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.dashboard,
              title: 'Dashboard',
              onTap: () => Navigator.pop(context),
            ),
            _buildDrawerItem(
              context,
              icon: Icons.people,
              title: 'Students',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const StudentsListScreen()),
                );
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.book,
              title: 'Courses',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CoursesListScreen()),
                );
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.library_books,
              title: 'Free Materials',
              onTap: () {
                Navigator.pop(context);
                // Navigate to free materials screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.person,
              title: 'Profile',
              onTap: () {
                Navigator.pop(context);
                // Navigate to profile screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.settings,
              title: 'Settings',
              onTap: () {
                Navigator.pop(context);
                // Navigate to settings screen
              },
            ),
            const Divider(),
            _buildDrawerItem(
              context,
              icon: Icons.local_offer,
              title: 'Coupons',
              onTap: () {
                Navigator.pop(context);
                // Navigate to coupons screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.payment,
              title: 'Payments',
              onTap: () {
                Navigator.pop(context);
                // Navigate to payments screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.quiz,
              title: 'Exams',
              onTap: () {
                Navigator.pop(context);
                // Navigate to exams screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.palette,
              title: 'Theme',
              onTap: () {
                Navigator.pop(context);
                // Navigate to theme screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.subject,
              title: 'Subjects',
              onTap: () {
                Navigator.pop(context);
                // Navigate to subjects screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.category,
              title: 'Categories',
              onTap: () {
                Navigator.pop(context);
                // Navigate to categories screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.group_work,
              title: 'Question Groups',
              onTap: () {
                Navigator.pop(context);
                // Navigate to question groups screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.question_answer,
              title: 'Question Bank',
              onTap: () {
                Navigator.pop(context);
                // Navigate to question bank screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.analytics,
              title: 'Analytics',
              onTap: () {
                Navigator.pop(context);
                // Navigate to analytics screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.video_call,
              title: 'Google Meet',
              onTap: () {
                Navigator.pop(context);
                // Navigate to google meet screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.storage,
              title: 'Storage',
              onTap: () {
                Navigator.pop(context);
                // Navigate to storage screen
              },
            ),
            _buildDrawerItem(
              context,
              icon: Icons.chat,
              title: 'Support Chat',
              onTap: () {
                Navigator.pop(context);
                // Navigate to support chat screen
              },
            ),
            const Divider(),
            _buildDrawerItem(
              context,
              icon: Icons.logout,
              title: 'Logout',
              onTap: () async {
                final apiService = ApiService();
                await apiService.logout();
                if (context.mounted) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
      hoverColor: Colors.grey[100],
    );
  }
}
