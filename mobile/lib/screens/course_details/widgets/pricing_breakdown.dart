import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class PricingBreakdown extends StatelessWidget {
  final Map<String, dynamic> course;
  final String? couponCode;
  final double? discountAmount;
  final double? updatedGstAmount;
  final double? updatedTotalPayable;

  const PricingBreakdown({
    super.key,
    required this.course,
    this.couponCode,
    this.discountAmount,
    this.updatedGstAmount,
    this.updatedTotalPayable,
  });

  @override
  Widget build(BuildContext context) {
    // Get pricing data with safe type conversion
    final String basePrice = _safeToString(course['price']);
    final bool gstEnabled = course['gstEnabled'] == true;
    final String gstPercentage = _safeToString(course['gstPercentage']);

    // Use updated values if available, otherwise fallback to course data
    final String gstAmount =
        updatedGstAmount != null
            ? updatedGstAmount!.toStringAsFixed(0)
            : _safeToString(course['gstAmount']);

    final String totalPrice =
        updatedTotalPayable != null
            ? updatedTotalPayable!.toStringAsFixed(0)
            : (_safeToString(course['totalPrice']) != '0'
                ? _safeToString(course['totalPrice'])
                : basePrice);

    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pricing Details',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Course Price
          _buildPriceRow('Course Price', '₹$basePrice'),

          // Coupon Discount
          if (couponCode != null && discountAmount != null) ...[
            const SizedBox(height: 12),
            _buildPriceRow(
              'Coupon ($couponCode)',
              '-₹${discountAmount!.toStringAsFixed(0)}',
              color: Colors.green,
            ),
          ],

          // GST (if enabled)
          if (gstEnabled) ...[
            const SizedBox(height: 12),
            _buildPriceRow(
              'GST ($gstPercentage%)',
              '+₹$gstAmount',
              isGst: true,
            ),
          ],

          const Divider(height: 24),

          // Total Price
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'You Pay',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(
                '₹$totalPrice',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    String value, {
    bool isGst = false,
    Color? color,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: color ?? (isGst ? Colors.grey[600] : Colors.black87),
            fontWeight: color != null ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: color ?? (isGst ? Colors.grey[700] : Colors.black87),
          ),
        ),
      ],
    );
  }

  // Helper method to safely convert any type to String
  String _safeToString(dynamic value) {
    if (value == null) return '0';
    if (value is String) return value;
    if (value is num) return value.toString();
    if (value is Map) return '0'; // If it's a Map, return default
    return value.toString();
  }
}
