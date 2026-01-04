import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../utils/constants.dart';
import '../help_support_screen.dart';
import '../../services/api_service.dart';

class HelpInfoScreen extends StatefulWidget {
  const HelpInfoScreen({super.key});

  @override
  State<HelpInfoScreen> createState() => _HelpInfoScreenState();
}

class _HelpInfoScreenState extends State<HelpInfoScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _settings;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await _apiService.getSettings();
    if (mounted) {
      setState(() {
        _settings = settings;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final contactEmail = _settings?['general']?['contactEmail'] ?? 'support@godofgraphics.in';
    final phoneNumber = _settings?['general']?['phoneNumber'] ?? '+91 91523 09282';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Help & Support', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 50,
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.support_agent, size: 60, color: AppConstants.primaryColor),
                ),
                const SizedBox(height: 20),
                const Text(
                  'How can we help you?',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                const Text(
                  'We are available to assist you with any queries or issues you might have regarding our courses.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
                const SizedBox(height: 40),
                
                _buildContactCard(
                  context,
                  Icons.phone_in_talk_outlined,
                  'Call Us',
                  phoneNumber,
                  Colors.green,
                  () => _launchURL('tel:${phoneNumber.replaceAll(' ', '')}'),
                ),
                const SizedBox(height: 16),
                _buildContactCard(
                  context,
                  Icons.email_outlined,
                  'Email Us',
                  contactEmail,
                  Colors.blue,
                  () => _launchURL('mailto:$contactEmail'),
                ),
                const SizedBox(height: 16),
                _buildContactCard(
                  context,
                  Icons.chat_bubble_outline,
                  'Live Chat',
                  'Chat with our support team',
                  Colors.orange,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const HelpSupportScreen()),
                    );
                  },
                ),
                
                const SizedBox(height: 40),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Frequently Asked Questions',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 10),
                _buildFAQTile('How to buy a course?'),
                _buildFAQTile('Where can I see my enrolled courses?'),
                _buildFAQTile('How to access free materials?'),
                _buildFAQTile('Payment success but course not showing?'),
              ],
            ),
          ),
    );
  }

  Widget _buildContactCard(BuildContext context, IconData icon, String title, String value, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(15),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[200]!),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(value, style: TextStyle(color: Colors.grey[600], fontSize: 15), overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQTile(String question) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(question, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.add, size: 20, color: Colors.grey),
      onTap: () {},
    );
  }

  Future<void> _launchURL(String url) async {
    try {
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      }
    } catch (e) {
      print('Could not launch $url');
    }
  }
}

