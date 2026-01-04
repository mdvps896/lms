import 'package:flutter/material.dart';

class CancellationPolicyScreen extends StatelessWidget {
  const CancellationPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Cancellation Policy',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'Users can cancel their subscriptions or course enrollments under the following conditions:',
            style: TextStyle(fontSize: 16, height: 1.5),
          ),
          SizedBox(height: 12),
          Text(
            '1. Subscription Cancellation\nYou can cancel your monthly/yearly subscription at any time from your account settings. The cancellation will take effect at the end of the current billing cycle.',
            style: TextStyle(fontSize: 16, height: 1.5),
          ),
        ],
      ),
    );
  }
}
