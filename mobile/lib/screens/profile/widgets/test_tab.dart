import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import 'package:intl/intl.dart';

class TestTab extends StatelessWidget {
  final List<dynamic> attempts;

  const TestTab({super.key, required this.attempts});

  @override
  Widget build(BuildContext context) {
    if (attempts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_turned_in_outlined, size: 80, color: Colors.grey[200]),
            const SizedBox(height: 16),
            const Text('No tests attempted yet'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: attempts.length,
      itemBuilder: (context, index) {
        final attempt = attempts[index];
        return _buildTestItem(attempt);
      },
    );
  }

  Widget _buildTestItem(Map<String, dynamic> attempt) {
    final DateTime date = DateTime.tryParse(attempt['date'] ?? '')?.toLocal() ?? DateTime.now();
    final String dateStr = DateFormat('MMM d, yyyy').format(date);
    final isPassed = attempt['passed'] == true;
    final score = (attempt['score'] as num).toDouble();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isPassed ? Colors.green : Colors.red).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPassed ? Icons.check_rounded : Icons.close_rounded,
                  color: isPassed ? Colors.green : Colors.red,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      attempt['examTitle'] ?? 'Test Name',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      attempt['subject'] ?? 'General',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ),
              Text(
                '${score.toInt()}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: isPassed ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSmallBadge(Icons.calendar_today, dateStr),
              _buildSmallBadge(Icons.grade_outlined, 'Grade: ${attempt['grade'] ?? 'N/A'}'),
              _buildSmallBadge(
                isPassed ? Icons.verified_user : Icons.error_outline,
                isPassed ? 'PASSED' : 'FAILED',
                color: isPassed ? Colors.green : Colors.red,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmallBadge(IconData icon, String label, {Color? color}) {
    return Row(
      children: [
        Icon(icon, size: 12, color: color ?? Colors.grey[400]),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: color ?? Colors.grey[600],
          ),
        ),
      ],
    );
  }
}
