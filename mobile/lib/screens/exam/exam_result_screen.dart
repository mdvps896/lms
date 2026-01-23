import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import '../../utils/constants.dart';

class ExamResultScreen extends StatefulWidget {
  final Map<String, dynamic> exam;
  final int totalQuestions;
  final int correctAnswers;
  final int totalMarks;
  final int scoredMarks;
  final int timeTaken; // in seconds

  const ExamResultScreen({
    super.key,
    required this.exam,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.totalMarks,
    required this.scoredMarks,
    required this.timeTaken,
  });

  @override
  State<ExamResultScreen> createState() => _ExamResultScreenState();
}

class _ExamResultScreenState extends State<ExamResultScreen> {
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );

    // Show confetti if passed
    if (_isPassed()) {
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

  bool _isPassed() {
    final double percentage =
        widget.totalMarks > 0
            ? (widget.scoredMarks.toDouble() / widget.totalMarks.toDouble()) *
                100
            : 0.0;

    double passCriteria = 40.0;
    final dynamic rawPassing = widget.exam['passingPercentage'];
    if (rawPassing != null) {
      passCriteria = double.tryParse(rawPassing.toString()) ?? 40.0;
    }

    final bool passed = percentage >= passCriteria;
    return passed;
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

  String _getExamTitle() {
    final title = widget.exam['title'] ?? widget.exam['name'];
    if (title is String) {
      return title;
    } else if (title is Map) {
      return title['name']?.toString() ?? 'N/A';
    }
    return 'N/A';
  }

  String _getCategoryName() {
    final category = widget.exam['category'];
    if (category is String) {
      return category;
    } else if (category is Map) {
      return category['name']?.toString() ?? 'General';
    }
    return 'General';
  }

  @override
  Widget build(BuildContext context) {
    final percentage =
        (widget.scoredMarks.toDouble() / widget.totalMarks.toDouble()) * 100;
    final isPassed = _isPassed();

    return WillPopScope(
      onWillPop: () async {
        Navigator.of(context).popUntil((route) => route.isFirst);
        return false;
      },
      child: Scaffold(
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
                      color: isPassed ? Colors.green : Colors.red,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(32),
                        bottomRight: Radius.circular(32),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          isPassed ? Icons.check_circle : Icons.cancel,
                          color: Colors.white,
                          size: 80,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          isPassed ? 'Congratulations!' : 'Keep Trying!',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isPassed
                              ? 'You have passed the test'
                              : 'You need more practice',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.white70,
                          ),
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
                                      color:
                                          isPassed ? Colors.green : Colors.red,
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
                                  icon: Icons.check_circle_outline,
                                  title: 'Correct',
                                  value: widget.correctAnswers.toString(),
                                  color: Colors.green,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildStatCard(
                                  icon: Icons.cancel_outlined,
                                  title: 'Wrong',
                                  value:
                                      (widget.totalQuestions -
                                              widget.correctAnswers)
                                          .toString(),
                                  color: Colors.red,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          Row(
                            children: [
                              Expanded(
                                child: _buildStatCard(
                                  icon: Icons.stars_outlined,
                                  title: 'Marks',
                                  value:
                                      '${widget.scoredMarks}/${widget.totalMarks}',
                                  color: Colors.orange,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildStatCard(
                                  icon: Icons.timer_outlined,
                                  title: 'Time Taken',
                                  value: _formatTime(widget.timeTaken),
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
                                  'Test Details',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppConstants.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                _buildDetailRow('Test Name', _getExamTitle()),
                                _buildDetailRow('Category', _getCategoryName()),
                                _buildDetailRow(
                                  'Total Questions',
                                  widget.totalQuestions.toString(),
                                ),
                                _buildDetailRow(
                                  'Passing Percentage',
                                  '${widget.exam['passingPercentage'] ?? 40}%',
                                ),
                                _buildDetailRow(
                                  'Your Percentage',
                                  '${percentage.toStringAsFixed(1)}%',
                                ),
                                _buildDetailRow(
                                  'Status',
                                  isPassed ? 'PASSED' : 'FAILED',
                                  valueColor:
                                      isPassed ? Colors.green : Colors.red,
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 100),
                        ],
                      ),
                    ),
                  ),

                  // Action Buttons
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                Navigator.of(
                                  context,
                                ).popUntil((route) => route.isFirst);
                              },
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                side: BorderSide(
                                  color: AppConstants.primaryColor,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text(
                                'Back to Home',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: AppConstants.primaryColor,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                // Share results or retry
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Feature coming soon!'),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppConstants.primaryColor,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: const Text(
                                'Share Result',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
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
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valueColor ?? AppConstants.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
