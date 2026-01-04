import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class QuestionNavigator extends StatelessWidget {
  final int totalQuestions;
  final int currentIndex;
  final Set<int> answeredQuestions;
  final Set<int> markedQuestions;
  final Function(int) onQuestionTap;

  const QuestionNavigator({
    super.key,
    required this.totalQuestions,
    required this.currentIndex,
    required this.answeredQuestions,
    required this.markedQuestions,
    required this.onQuestionTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const Text(
                  'Question Navigator',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textPrimary,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),

          // Legend
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildLegendItem(
                  color: AppConstants.primaryColor,
                  label: 'Current',
                ),
                _buildLegendItem(
                  color: Colors.green,
                  label: 'Answered',
                ),
                _buildLegendItem(
                  color: Colors.orange,
                  label: 'Marked',
                ),
                _buildLegendItem(
                  color: Colors.grey[300]!,
                  label: 'Not Visited',
                  textColor: Colors.grey[700]!,
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Question grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1,
              ),
              itemCount: totalQuestions,
              itemBuilder: (context, index) {
                final isCurrent = index == currentIndex;
                final isAnswered = answeredQuestions.contains(index);
                final isMarked = markedQuestions.contains(index);

                Color backgroundColor;
                Color textColor = Colors.white;

                if (isCurrent) {
                  backgroundColor = AppConstants.primaryColor;
                } else if (isMarked) {
                  backgroundColor = Colors.orange;
                } else if (isAnswered) {
                  backgroundColor = Colors.green;
                } else {
                  backgroundColor = Colors.grey[300]!;
                  textColor = Colors.grey[700]!;
                }

                return GestureDetector(
                  onTap: () => onQuestionTap(index),
                  child: Container(
                    decoration: BoxDecoration(
                      color: backgroundColor,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: isCurrent
                          ? [
                              BoxShadow(
                                color: AppConstants.primaryColor.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Summary
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(
                top: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem(
                  'Total',
                  totalQuestions.toString(),
                  Colors.blue,
                ),
                _buildSummaryItem(
                  'Answered',
                  answeredQuestions.length.toString(),
                  Colors.green,
                ),
                _buildSummaryItem(
                  'Marked',
                  markedQuestions.length.toString(),
                  Colors.orange,
                ),
                _buildSummaryItem(
                  'Not Answered',
                  (totalQuestions - answeredQuestions.length).toString(),
                  Colors.red,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem({
    required Color color,
    required String label,
    Color? textColor,
  }) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: textColor ?? AppConstants.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}
