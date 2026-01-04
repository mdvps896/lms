import 'dart:async';
import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart';
import 'widgets/question_card.dart';
import 'widgets/question_navigator.dart';
import 'exam_result_screen.dart';

class ExamTakingScreen extends StatefulWidget {
  final Map<String, dynamic> exam;

  const ExamTakingScreen({super.key, required this.exam});

  @override
  State<ExamTakingScreen> createState() => _ExamTakingScreenState();
}

class _ExamTakingScreenState extends State<ExamTakingScreen> {
  int _currentQuestionIndex = 0;
  List<Map<String, dynamic>> _allQuestions = [];
  Map<int, dynamic> _answers = {}; // questionIndex -> answer
  Set<int> _markedForReview = {};
  late int _remainingSeconds;
  int _durationMinutes = 60; // Default duration
  Timer? _timer;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
    _startTimer();
  }

  void _loadQuestions() {
    List<Map<String, dynamic>> questions = [];
    if (widget.exam['questionGroups'] != null) {
      for (var group in widget.exam['questionGroups']) {
        if (group['questions'] != null) {
          for (var question in group['questions']) {
            questions.add({
              ...question,
              'groupName': group['name'] ?? 'General',
            });
          }
        }
      }
    }
    setState(() {
      _allQuestions = questions;
    });
  }

  void _startTimer() {
    final duration = widget.exam['duration'];
    _durationMinutes = duration is int ? duration : int.tryParse(duration.toString()) ?? 60;
    _remainingSeconds = _durationMinutes * 60; // Convert minutes to seconds
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        _timer?.cancel();
        _submitExam();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int seconds) {
    int hours = seconds ~/ 3600;
    int minutes = (seconds % 3600) ~/ 60;
    int secs = seconds % 60;
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _onAnswerSelected(dynamic answer) {
    setState(() {
      _answers[_currentQuestionIndex] = answer;
    });
  }

  void _toggleMarkForReview() {
    setState(() {
      if (_markedForReview.contains(_currentQuestionIndex)) {
        _markedForReview.remove(_currentQuestionIndex);
      } else {
        _markedForReview.add(_currentQuestionIndex);
      }
    });
  }

  void _goToQuestion(int index) {
    setState(() {
      _currentQuestionIndex = index;
    });
  }

  void _previousQuestion() {
    if (_currentQuestionIndex > 0) {
      setState(() {
        _currentQuestionIndex--;
      });
    }
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _allQuestions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
    }
  }

  void _saveAndNext() {
    if (_currentQuestionIndex < _allQuestions.length - 1) {
      _nextQuestion();
    } else {
      _submitExam();
    }
  }

  Future<void> _submitExam() async {
    if (_isSubmitting) return;
    
    setState(() {
      _isSubmitting = true;
    });

    _timer?.cancel();

    // Calculate score
    int correctAnswers = 0;
    int totalMarks = 0;
    int scoredMarks = 0;

    for (int i = 0; i < _allQuestions.length; i++) {
      final question = _allQuestions[i];
      final marks = (question['marks'] ?? 1) as int;
      totalMarks += marks;

      if (_answers.containsKey(i)) {
        final userAnswer = _answers[i];
        final options = question['options'] as List? ?? [];

        // Check if answer is correct
        bool isCorrect = false;
        
        if (question['type'] == 'multiple_choice') {
          // For multiple choice, check if all selected options are correct
          if (userAnswer is List) {
            isCorrect = true;
            for (var selectedOption in userAnswer) {
              bool foundCorrect = false;
              for (var option in options) {
                if (option is Map && _isSameOption(option, selectedOption)) {
                  if (option['isCorrect'] == true) {
                    foundCorrect = true;
                    break;
                  }
                }
              }
              if (!foundCorrect) {
                isCorrect = false;
                break;
              }
            }
          }
        } else {
          // For single choice (MCQ), check if selected option is correct
          for (var option in options) {
            if (option is Map && _isSameOption(option, userAnswer)) {
              isCorrect = option['isCorrect'] == true;
              break;
            }
          }
        }

        if (isCorrect) {
          correctAnswers++;
          scoredMarks += marks;
        }
      }
    }

    // Generate percentage and check against criteria
    final percentage = totalMarks > 0 ? (scoredMarks / totalMarks * 100) : 0.0;
    
    // Defensive parsing for passing percentage
    double passCriteria = 40.0;
    final dynamic rawPassing = widget.exam['passingPercentage'];
    if (rawPassing != null) {
        passCriteria = double.tryParse(rawPassing.toString()) ?? 40.0;
    }
    
    final bool passed = percentage >= passCriteria;
    
    print('🏁 SUBMITTING EXAM: Title=${_getExamTitle()}');
    print('📊 Scored: $scoredMarks / $totalMarks ($percentage%)');
    print('🎯 Pass Criteria: $passCriteria');
    print('🏆 Result: ${passed ? "PASS" : "FAIL"}');
    
    try {
      final ApiService apiService = ApiService();
      await apiService.submitExamAttempt(
        examId: widget.exam['_id'],
        answers: _answers,
        score: scoredMarks,
        totalMarks: totalMarks,
        timeTaken: (_durationMinutes * 60) - _remainingSeconds,
        passed: passed,
      );
      print('✅ Exam attempt saved to database');
    } catch (e) {
      print('❌ Error saving exam attempt: $e');
    }

    // Navigate to result screen
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ExamResultScreen(
            exam: widget.exam,
            totalQuestions: _allQuestions.length,
            correctAnswers: correctAnswers,
            totalMarks: totalMarks,
            scoredMarks: scoredMarks,
            timeTaken: (_durationMinutes * 60) - _remainingSeconds,
          ),
        ),
      );
    }
  }

  bool _isSameOption(Map option, dynamic userAnswer) {
    if (userAnswer is Map) {
      return option['text'] == userAnswer['text'];
    }
    return option == userAnswer;
  }

  String _getExamTitle() {
    final title = widget.exam['title'] ?? widget.exam['name'];
    if (title is String) {
      return title;
    } else if (title is Map) {
      return title['name']?.toString() ?? 'Test';
    }
    return 'Test';
  }

  void _showSubmitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit Test?'),
        content: Text(
          'You have answered ${_answers.length} out of ${_allQuestions.length} questions.\n\nAre you sure you want to submit?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
            ),
            child: const Text('Submit', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_allQuestions.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: AppConstants.primaryColor,
          title: const Text('Loading...', style: TextStyle(color: Colors.white)),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final currentQuestion = _allQuestions[_currentQuestionIndex];
    final isAnswered = _answers.containsKey(_currentQuestionIndex);
    final isMarked = _markedForReview.contains(_currentQuestionIndex);

    return WillPopScope(
      onWillPop: () async {
        final shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit Test?'),
            content: const Text('Your progress will be lost. Are you sure?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Exit', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
        return shouldPop ?? false;
      },
      child: Scaffold(
        backgroundColor: AppConstants.backgroundColor,
        appBar: AppBar(
          backgroundColor: AppConstants.primaryColor,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => QuestionNavigator(
                  totalQuestions: _allQuestions.length,
                  currentIndex: _currentQuestionIndex,
                  answeredQuestions: _answers.keys.toSet(),
                  markedQuestions: _markedForReview,
                  onQuestionTap: (index) {
                    Navigator.pop(context);
                    _goToQuestion(index);
                  },
                ),
              );
            },
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _getExamTitle(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'Question ${_currentQuestionIndex + 1}/${_allQuestions.length}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          actions: [
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _remainingSeconds < 300 ? Colors.red : Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.timer,
                    color: _remainingSeconds < 300 ? Colors.white : Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatTime(_remainingSeconds),
                    style: TextStyle(
                      color: _remainingSeconds < 300 ? Colors.white : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            // Progress bar
            LinearProgressIndicator(
              value: (_currentQuestionIndex + 1) / _allQuestions.length,
              backgroundColor: Colors.grey[200],
              valueColor: const AlwaysStoppedAnimation<Color>(AppConstants.primaryColor),
            ),

            // Question content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: QuestionCard(
                  question: currentQuestion,
                  questionNumber: _currentQuestionIndex + 1,
                  selectedAnswer: _answers[_currentQuestionIndex],
                  onAnswerSelected: _onAnswerSelected,
                ),
              ),
            ),

            // Bottom action buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _toggleMarkForReview,
                            icon: Icon(
                              isMarked ? Icons.bookmark : Icons.bookmark_border,
                              size: 18,
                            ),
                            label: Text(isMarked ? 'Marked' : 'Mark for Review'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: isMarked ? AppConstants.primaryColor : Colors.grey[700],
                              side: BorderSide(
                                color: isMarked ? AppConstants.primaryColor : Colors.grey[300]!,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _answers.remove(_currentQuestionIndex);
                              });
                            },
                            icon: const Icon(Icons.clear, size: 18),
                            label: const Text('Clear'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: BorderSide(color: Colors.red[300]!),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (_currentQuestionIndex > 0)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _previousQuestion,
                              icon: const Icon(Icons.arrow_back, size: 18),
                              label: const Text('Previous'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                        if (_currentQuestionIndex > 0) const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: _currentQuestionIndex < _allQuestions.length - 1
                                ? _saveAndNext
                                : _showSubmitDialog,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppConstants.primaryColor,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: Text(
                              _currentQuestionIndex < _allQuestions.length - 1
                                  ? 'SAVE & NEXT'
                                  : 'SUBMIT',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
