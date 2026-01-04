import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import 'package:intl/intl.dart';

class PerformanceTab extends StatelessWidget {
  final List<dynamic> attempts;

  const PerformanceTab({super.key, required this.attempts});

  @override
  Widget build(BuildContext context) {
    if (attempts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.insights_rounded, size: 80, color: Colors.grey[200]),
            const SizedBox(height: 16),
            const Text('No performance data available'),
            const SizedBox(height: 4),
            Text('Complete tests to see your progress', style: TextStyle(color: Colors.grey[400])),
          ],
        ),
      );
    }

    // Calculate basic stats
    final totalTests = attempts.length;
    final avgScore = attempts.isEmpty ? 0 : 
        attempts.map((a) => (a['score'] as num).toDouble()).reduce((a, b) => a + b) / totalTests;
    final passRate = (attempts.where((a) => a['status'] == 'passed').length / totalTests * 100).toInt();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Stat Cards
          Row(
            children: [
              _buildStatCard('Average', '${avgScore.toStringAsFixed(1)}%', Icons.analytics, Colors.blue),
              const SizedBox(width: 16),
              _buildStatCard('Pass Rate', '$passRate%', Icons.check_circle, Colors.green),
            ],
          ),
          const SizedBox(height: 20),
          
          // Performance Chart Placeholder / History
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Recent Scores',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 20),
                ...attempts.take(5).map((a) => _buildScoreItem(a)).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: color.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreItem(Map<String, dynamic> attempt) {
    final score = (attempt['score'] as num).toDouble();
    final isPassed = attempt['status'] == 'passed';
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  attempt['examTitle'] ?? 'Exam',
                  style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '${score.toInt()}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isPassed ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              backgroundColor: Colors.grey[100],
              valueColor: AlwaysStoppedAnimation<Color>(isPassed ? Colors.green : Colors.red),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}
