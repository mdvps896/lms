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

  String _stripHtmlTags(String htmlString) {
    // Remove HTML tags using regex
    final RegExp exp = RegExp(r'<[^>]*>', multiLine: true, caseSensitive: false);
    return htmlString.replaceAll(exp, '').replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&').trim();
  }

  String _getQuestionTypeLabel(String type) {
    switch (type) {
      case 'mcq':
      case 'single_choice':
        return 'single_choice';
      case 'multiple_choice':
        return 'multiple_choice';
      case 'short_answer':
        return 'short_answer';
      case 'long_answer':
        return 'long_answer';
      case 'true_false':
        return 'true/false';
      default:
        return type;
    }
  }

  Color _getQuestionTypeColor(String type) {
    switch (type) {
      case 'multiple_choice':
        return Colors.purple;
      case 'short_answer':
        return Colors.orange;
      case 'long_answer':
        return Colors.teal;
      case 'true_false':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor.withValues(alpha: 0.1),
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getQuestionTypeColor(questionType).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getQuestionTypeLabel(questionType),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: _getQuestionTypeColor(questionType),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Question text
            Text(
              _stripHtmlTags(
                question['questionText'] ??
                    question['question'] ??
                    'Question not available',
              ),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: AppConstants.textPrimary,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 20),

            // Options or Text Input
            if (questionType == 'short_answer' || questionType == 'long_answer')
              _buildTextAnswerInput(questionType)
            else if (questionType == 'multiple_choice')
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
              color:
                  isSelected
                      ? AppConstants.primaryColor.withValues(alpha: 0.1)
                      : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color:
                    isSelected ? AppConstants.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color:
                        isSelected ? AppConstants.primaryColor : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color:
                          isSelected
                              ? AppConstants.primaryColor
                              : Colors.grey[400]!,
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
                      color:
                          isSelected
                              ? AppConstants.textPrimary
                              : Colors.grey[800],
                      fontWeight:
                          isSelected ? FontWeight.w500 : FontWeight.normal,
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

  Widget _buildTextAnswerInput(String questionType) {
    final wordLimit = question['wordLimit'] ?? (questionType == 'short_answer' ? 50 : 200);
    final currentText = selectedAnswer?.toString() ?? '';
    final wordCount = currentText.trim().isEmpty ? 0 : currentText.trim().split(RegExp(r'\s+')).length;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: wordCount > wordLimit ? Colors.red : Colors.grey[300]!,
              width: wordCount > wordLimit ? 2 : 1,
            ),
          ),
          child: TextField(
            controller: TextEditingController(text: currentText)..selection = TextSelection.fromPosition(TextPosition(offset: currentText.length)),
            onChanged: (value) {
              // Count words in the new value
              final newWordCount = value.trim().isEmpty ? 0 : value.trim().split(RegExp(r'\s+')).length;
              
              // Only allow the change if within word limit
              if (newWordCount <= wordLimit) {
                onAnswerSelected(value);
              } else {
                // If exceeds limit, don't update (keep previous value)
                // This prevents typing beyond the limit
                onAnswerSelected(currentText);
              }
            },
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.newline,
            maxLines: null,
            minLines: questionType == 'long_answer' ? 8 : 3,
            decoration: InputDecoration(
              hintText: questionType == 'short_answer' 
                  ? 'Type your answer here...\nPress Enter for new line'
                  : 'Write your detailed answer here...\nPress Enter for new line',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
            style: const TextStyle(
              fontSize: 15,
              color: AppConstants.textPrimary,
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Words: $wordCount / $wordLimit',
              style: TextStyle(
                fontSize: 12,
                color: wordCount >= wordLimit ? Colors.orange : Colors.grey[600],
                fontWeight: wordCount >= wordLimit ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (wordCount >= wordLimit)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Limit reached',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ],
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
              color:
                  isSelected
                      ? AppConstants.primaryColor.withValues(alpha: 0.1)
                      : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color:
                    isSelected ? AppConstants.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color:
                        isSelected ? AppConstants.primaryColor : Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color:
                          isSelected
                              ? AppConstants.primaryColor
                              : Colors.grey[400]!,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child:
                        isSelected
                            ? const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 18,
                            )
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
                      color:
                          isSelected
                              ? AppConstants.textPrimary
                              : Colors.grey[800],
                      fontWeight:
                          isSelected ? FontWeight.w500 : FontWeight.normal,
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
