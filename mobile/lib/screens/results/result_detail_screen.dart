import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import '../../utils/constants.dart';

class ResultDetailScreen extends StatefulWidget {
  final Map<String, dynamic> attempt;

  const ResultDetailScreen({super.key, required this.attempt});

  @override
  State<ResultDetailScreen> createState() => _ResultDetailScreenState();
}

class _ResultDetailScreenState extends State<ResultDetailScreen> {
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );

    // Show confetti if passed
    if (widget.attempt['passed'] == true) {
      Future.delayed(const Duration(milliseconds: 500), () {
        _confettiController.play();
      });
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  String _formatTime(int seconds) {
    int hours = seconds ~/ 3600;
    int minutes = (seconds % 3600) ~/ 60;
    int secs = seconds % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m ${secs}s';
    }
    return '${minutes}m ${secs}s';
  }

  @override
  Widget build(BuildContext context) {
    final examData = widget.attempt['exam'];
    final examName =
        examData is Map ? (examData['name'] ?? 'Unknown Test') : 'Unknown Test';
    final score = widget.attempt['score'] ?? 0;
    final totalMarks = widget.attempt['totalMarks'] ?? 100;
    final percentage = totalMarks > 0 ? (score / totalMarks * 100) : 0;
    final passed = widget.attempt['passed'] ?? false;
    final timeTaken = widget.attempt['timeTaken'] ?? 0;
    final submittedAt = DateTime.tryParse(widget.attempt['submittedAt'] ?? '');

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: passed ? Colors.green : Colors.red,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(32),
                      bottomRight: Radius.circular(32),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_back,
                              color: Colors.white,
                            ),
                            onPressed: () => Navigator.pop(context),
                          ),
                          const Spacer(),
                        ],
                      ),
                      Icon(
                        passed ? Icons.check_circle : Icons.cancel,
                        color: Colors.white,
                        size: 80,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        passed ? 'Congratulations!' : 'Keep Trying!',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        examName,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Score Card
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        // Percentage Circle
                        Container(
                          width: 180,
                          height: 180,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '${percentage.toStringAsFixed(1)}%',
                                  style: TextStyle(
                                    fontSize: 48,
                                    fontWeight: FontWeight.bold,
                                    color: passed ? Colors.green : Colors.red,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Score',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Stats Grid
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatCard(
                                icon: Icons.stars_outlined,
                                title: 'Marks',
                                value: '$score/$totalMarks',
                                color: Colors.orange,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                icon: Icons.timer_outlined,
                                title: 'Time Taken',
                                value: _formatTime(timeTaken),
                                color: Colors.blue,
                                valueSize: 16,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // Test Info
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Attempt Details',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppConstants.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              _buildDetailRow('Test Name', examName),
                              _buildDetailRow('Score', '$score marks'),
                              _buildDetailRow(
                                'Total Marks',
                                '$totalMarks marks',
                              ),
                              _buildDetailRow(
                                'Percentage',
                                '${percentage.toStringAsFixed(1)}%',
                              ),
                              _buildDetailRow(
                                'Time Taken',
                                _formatTime(timeTaken),
                              ),
                              if (submittedAt != null)
                                _buildDetailRow(
                                  'Submitted At',
                                  '${submittedAt.day}/${submittedAt.month}/${submittedAt.year} ${submittedAt.hour}:${submittedAt.minute.toString().padLeft(2, '0')}',
                                ),
                              _buildDetailRow(
                                'Status',
                                passed ? 'PASSED' : 'FAILED',
                                valueColor: passed ? Colors.green : Colors.red,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Confetti
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              particleDrag: 0.05,
              emissionFrequency: 0.05,
              numberOfParticles: 50,
              gravity: 0.2,
              shouldLoop: false,
              colors: const [
                Colors.green,
                Colors.blue,
                Colors.pink,
                Colors.orange,
                Colors.purple,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    double valueSize = 24,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: valueSize,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: valueColor ?? AppConstants.textPrimary,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
