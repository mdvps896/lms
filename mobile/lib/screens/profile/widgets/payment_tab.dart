import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import 'package:intl/intl.dart';
import '../transaction_detail_screen.dart';

class PaymentTab extends StatelessWidget {
  final List<dynamic> payments;

  const PaymentTab({super.key, required this.payments});

  @override
  Widget build(BuildContext context) {
    if (payments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 80,
              color: Colors.grey[200],
            ),
            const SizedBox(height: 16),
            const Text('No transactions found'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: payments.length,
      itemBuilder: (context, index) {
        final payment = payments[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => TransactionDetailScreen(payment: payment),
              ),
            );
          },
          child: _buildPaymentItem(payment),
        );
      },
    );
  }

  Widget _buildPaymentItem(Map<String, dynamic> payment) {
    final DateTime date = DateTime.parse(payment['date']).toLocal();
    final String dateStr = DateFormat('MMM d, yyyy').format(date);
    final isFree = payment['isFree'] ?? false;
    final amount = (payment['amount'] as num).toDouble();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color:
                  isFree
                      ? Colors.green.withValues(alpha: 0.1)
                      : AppConstants.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isFree
                  ? Icons.card_giftcard
                  : Icons.account_balance_wallet_outlined,
              color: isFree ? Colors.green : AppConstants.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment['courseTitle'] ?? 'Course Purchase',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  dateStr,
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isFree ? 'FREE' : '₹${amount.toInt()}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: isFree ? Colors.green : AppConstants.textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color:
                      (payment['status'] == 'success')
                          ? Colors.green.withValues(alpha: 0.1)
                          : Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  payment['status']?.toUpperCase() ?? 'SUCCESS',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color:
                        (payment['status'] == 'success')
                            ? Colors.green
                            : Colors.red,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
