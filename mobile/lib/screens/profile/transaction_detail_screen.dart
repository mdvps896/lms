import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import 'package:intl/intl.dart';
import 'package:screenshot/screenshot.dart';
import 'package:gal/gal.dart';
import '../help_support_screen.dart';

class TransactionDetailScreen extends StatefulWidget {
  final Map<String, dynamic> payment;

  const TransactionDetailScreen({super.key, required this.payment});

  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isDownloading = false;

  Future<void> _captureAndSave() async {
    if (_isDownloading) return;

    setState(() => _isDownloading = true);

    try {
      // Small delay to ensure UI is settled
      await Future.delayed(const Duration(milliseconds: 300));

      // Capture the widget
      final Uint8List? image = await _screenshotController.capture(
        delay: const Duration(milliseconds: 10),
      );

      if (image != null) {
        // Gal handles permissions and saving across platforms robustly
        try {
          // Check if we have permission first (Best practice with Gal)
          if (!await Gal.hasAccess()) {
            await Gal.requestAccess();
          }

          // Save to Gallery
          await Gal.putImageBytes(
            image,
            name: "receipt_${DateTime.now().millisecondsSinceEpoch}",
          );

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Receipt saved to Gallery! ✅'),
                backgroundColor: Colors.green,
              ),
            );
          }
        } catch (e) {
          _showError('Gallery Access Denied or Failed: $e');
        }
      }
    } catch (e) {

      _showError('Error: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'OK',
            textColor: Colors.white,
            onPressed: () {},
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final payment = widget.payment;
    final DateTime date = DateTime.parse(payment['date']).toLocal();
    final String timeStr = DateFormat('hh:mm a').format(date);
    final String dateStr = DateFormat('dd MMM yyyy').format(date);
    final amount = (payment['amount'] as num).toDouble();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            const Text(
              'Transaction Successful',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2), // Added small space
            Text(
              '$timeStr on $dateStr',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Screenshot(
              controller: _screenshotController,
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.grey.withValues(alpha: 0.2),
                          width: 1,
                        ), // Slightly lighter border
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Received by',
                            style: TextStyle(
                              color: Colors.black54,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: AppConstants.primaryColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const CircleAvatar(
                                  radius: 25,
                                  backgroundColor: Colors.white,
                                  backgroundImage: AssetImage(
                                    'assets/logo.png',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'GOD OF GRAPHICS',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const Text(
                                      'support@godofgraphics.com',
                                      style: TextStyle(color: Colors.black54),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '₹${amount.toInt()}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              const Text(
                                'Course Name : ',
                                style: TextStyle(color: Colors.black54),
                              ),
                              Expanded(
                                child: Text(
                                  payment['courseTitle'] ?? 'General Course',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.check_circle,
                                color: Colors.green[700],
                                size: 16,
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          _buildDetailRow(
                            Icons.list_alt,
                            'Payment Details',
                            isExpandable: true,
                          ),
                          const SizedBox(height: 16),
                          _buildInfoField(
                            'Transaction ID',
                            payment['razorpayPaymentId'] ??
                                'T${DateTime.now().millisecondsSinceEpoch}',
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Credited to',
                            style: TextStyle(
                              color: Colors.black54,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: AppConstants.secondaryColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.account_balance,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Razorpay Order ID',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      payment['razorpayOrderId'] ??
                                          payment['razorpay_order_id'] ??
                                          (payment['isFree'] == true
                                              ? 'FREE_ENROLLMENT'
                                              : 'N/A'),
                                      style: const TextStyle(
                                        color: Colors.black54,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '₹${amount.toInt()}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildActionIcon(
                                Icons.history,
                                'History',
                                onTap: () => Navigator.pop(context),
                              ),
                              _buildActionIcon(
                                _isDownloading
                                    ? Icons.hourglass_empty
                                    : Icons.download_for_offline_outlined,
                                _isDownloading ? 'Saving...' : 'Download',
                                onTap: _isDownloading ? null : _captureAndSave,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const HelpSupportScreen(),
                          ),
                        );
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.grey.withValues(alpha: 0.2),
                            width: 1,
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.chat_bubble_outline_rounded,
                              color: AppConstants.primaryColor,
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Contact Support',
                              style: TextStyle(fontWeight: FontWeight.w500),
                            ),
                            Spacer(),
                            Icon(Icons.chevron_right, color: Colors.black54),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String title, {
    bool isExpandable = false,
  }) {
    return Row(
      children: [
        Icon(icon, color: AppConstants.primaryColor, size: 20),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const Spacer(),
        if (isExpandable)
          const Icon(Icons.keyboard_arrow_up, color: Colors.black54),
      ],
    );
  }

  Widget _buildInfoField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.black54, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            const Icon(
              Icons.copy_outlined,
              size: 16,
              color: AppConstants.primaryColor,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionIcon(IconData icon, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppConstants.primaryColor, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.black87),
          ),
        ],
      ),
    );
  }
}
