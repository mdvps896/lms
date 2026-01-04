import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class QuestionCard extends StatelessWidget {
  final Map<String, dynamic> question;
  final int questionNumber;
  final dynamic selectedAnswer;
  final Function(dynamic) onAnswerSelected;

  const QuestionCard({
    super.key,
    required this.question,
    required this.questionNumber,
    required this.selectedAnswer,
    required this.onAnswerSelected,
  });

  @override
  Widget build(BuildContext context) {
    final questionType = question['type'] ?? 'single_choice';
    final marks = question['marks'] ?? 1;

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Ques. No $questionNumber',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.primaryColor,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '$marks Mark${marks > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.green,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: questionType == 'multiple_choice'
                        ? Colors.purple.withOpacity(0.1)
                        : Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    questionType == 'multiple_choice' ? 'multiple_choice' : 'single_choice',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: questionType == 'multiple_choice' ? Colors.purple : Colors.blue,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Question text
            Text(
              question['questionText'] ?? question['question'] ?? 'Question not available',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: AppConstants.textPrimary,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 20),

            // Options
            if (questionType == 'multiple_choice')
              _buildMultipleChoiceOptions()
            else
              _buildSingleChoiceOptions(),
          ],
        ),
      ),
    );
  }

  String _getOptionText(dynamic option) {
    if (option is Map) {
      return option['text']?.toString() ?? '';
    }
    return option.toString();
  }

  Widget _buildSingleChoiceOptions() {
    final options = question['options'] as List? ?? [];
    
    return Column(
      children: List.generate(options.length, (index) {
        final option = options[index];
        final optionLabel = String.fromCharCode(65 + index); // A, B, C, D
        final isSelected = selectedAnswer == option;

        return GestureDetector(
          onTap: () => onAnswerSelected(option),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppConstants.primaryColor.withOpacity(0.1)
                  : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppConstants.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isSelected ? AppConstants.primaryColor : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? AppConstants.primaryColor : Colors.grey[400]!,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      optionLabel,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Colors.grey[700],
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _getOptionText(option),
                    style: TextStyle(
                      fontSize: 15,
                      color: isSelected ? AppConstants.textPrimary : Colors.grey[800],
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                if (isSelected)
                  const Icon(
                    Icons.check_circle,
                    color: AppConstants.primaryColor,
                    size: 24,
                  ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildMultipleChoiceOptions() {
    final options = question['options'] as List? ?? [];
    final selectedOptions = (selectedAnswer as List?) ?? [];

    return Column(
      children: List.generate(options.length, (index) {
        final option = options[index];
        final optionLabel = String.fromCharCode(65 + index); // A, B, C, D
        final isSelected = selectedOptions.contains(option);

        return GestureDetector(
          onTap: () {
            List<dynamic> newSelection = List.from(selectedOptions);
            if (isSelected) {
              newSelection.remove(option);
            } else {
              newSelection.add(option);
            }
            onAnswerSelected(newSelection);
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppConstants.primaryColor.withOpacity(0.1)
                  : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppConstants.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isSelected ? AppConstants.primaryColor : Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isSelected ? AppConstants.primaryColor : Colors.grey[400]!,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 18)
                        : Text(
                            optionLabel,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700],
                              fontSize: 14,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _getOptionText(option),
                    style: TextStyle(
                      fontSize: 15,
                      color: isSelected ? AppConstants.textPrimary : Colors.grey[800],
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}
