import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import 'dashboard/dashboard_screen.dart';
import 'analytics/analytics_dashboard_screen.dart';
import 'analytics/orders_analytics_screen.dart';
import 'settings/settings_screen.dart';
import 'shared/admin_header.dart';
import 'shared/admin_drawer.dart';

class AdminMainScreen extends StatefulWidget {
  const AdminMainScreen({super.key});

  @override
  State<AdminMainScreen> createState() => _AdminMainScreenState();
}

class _AdminMainScreenState extends State<AdminMainScreen> {
  int _selectedIndex = 0;
  bool _isLoading = false;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const AnalyticsDashboardScreen(),
    const OrdersAnalyticsScreen(),
    const AdminSettingsScreen(),
  ];

  final List<String> _titles = [
    'Dashboard',
    'Analytics',
    'Orders',
    'Settings',
  ];

  void _onItemTapped(int index) {
    if (_selectedIndex != index) {
      setState(() {
        _isLoading = true;
      });
      
      // Simulate page load with progress indicator
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          setState(() {
            _selectedIndex = index;
            _isLoading = false;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AdminHeader(
        title: _titles[_selectedIndex],
        onSearchTap: () {
          // Navigate to search screen
        },
        onNotificationTap: () {
          // Navigate to notification screen
        },
      ),
      drawer: const AdminDrawer(),
      body: Column(
        children: [
          // Top progress indicator
          if (_isLoading)
            const LinearProgressIndicator(
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
              minHeight: 3,
            )
          else
            const SizedBox(height: 3),
          // Main content
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _screens[_selectedIndex],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.home_rounded, 'Home', 0),
                _buildNavItem(Icons.analytics_rounded, 'Analytics', 1),
                _buildNavItem(Icons.receipt_long_rounded, 'Orders', 2),
                _buildNavItem(Icons.settings_rounded, 'Settings', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _selectedIndex == index;
    return InkWell(
      onTap: () => _onItemTapped(index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? AppConstants.primaryColor : Colors.grey,
              size: 28,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppConstants.primaryColor : Colors.grey,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
