import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import 'about_us_screen.dart';
import 'privacy_policy_screen.dart';
import 'terms_conditions_screen.dart';
import 'refund_policy_screen.dart';
import 'cancellation_policy_screen.dart';
import 'contact_us_screen.dart';
import 'return_policy_screen.dart';

class LegalTabsScreen extends StatefulWidget {
  final int initialIndex;
  const LegalTabsScreen({super.key, this.initialIndex = 0});

  @override
  State<LegalTabsScreen> createState() => _LegalTabsScreenState();
}

class _LegalTabsScreenState extends State<LegalTabsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this, initialIndex: widget.initialIndex);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Policies & Info', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'About Us'),
            Tab(text: 'Privacy Policy'),
            Tab(text: 'Terms'),
            Tab(text: 'Refund'),
            Tab(text: 'Returns'),
            Tab(text: 'Cancellation'),
            Tab(text: 'Contact Us'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          AboutUsScreen(),
          PrivacyPolicyScreen(),
          TermsConditionsScreen(),
          RefundPolicyScreen(),
          ReturnPolicyScreen(),
          CancellationPolicyScreen(),
          ContactUsScreen(),
        ],
      ),
    );
  }
}
