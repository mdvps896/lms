import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart';
import 'exam_taking_screen.dart';

class ExamDetailScreen extends StatefulWidget {
  final Map<String, dynamic> exam;
  final String? examId;

  const ExamDetailScreen({super.key, required this.exam, this.examId});

  @override
  State<ExamDetailScreen> createState() => _ExamDetailScreenState();
}

class _ExamDetailScreenState extends State<ExamDetailScreen> {
  final ApiService _apiService = ApiService();
  late Map<String, dynamic> _fullExamData;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    
    // Always start with the basic exam data
    _fullExamData = widget.exam;
    
    // Load full data in background if examId is provided
    if (widget.examId != null) {
      _loadFullExamData();
    }
  }

  Future<void> _loadFullExamData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getExamById(widget.examId!);
      
      if (data != null && mounted) {
        setState(() {
          _fullExamData = data;
          _isLoading = false;
        });
      } else {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      print('Error loading full exam data: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Map<String, dynamic> get _displayExam => _fullExamData;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Test Details',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryColor,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(24),
                        bottomRight: Radius.circular(24),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _displayExam['title'] ?? _displayExam['name'] ?? 'Test',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _getCategoryName(_displayExam['category']),
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Test Info Cards
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Test Information',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        Row(
                          children: [
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.timer_outlined,
                                title: 'Duration',
                                value: '${_displayExam['duration'] ?? 0} min',
                                color: Colors.blue,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.quiz_outlined,
                                title: 'Questions',
                                value: _getTotalQuestions(_displayExam),
                                color: Colors.orange,
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 12),
                        
                        Row(
                          children: [
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.stars_outlined,
                                title: 'Total Marks',
                                value: '${_displayExam['totalMarks'] ?? _getTotalMarks(_displayExam)}',
                                color: Colors.green,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.check_circle_outline,
                                title: 'Passing Marks',
                                value: _getPassingMarks(_displayExam),
                                color: Colors.purple,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),
                        
                        Row(
                          children: [
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.repeat_outlined,
                                title: 'Max Attempts',
                                value: _getMaxAttempts(_displayExam),
                                color: Colors.red,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildInfoCard(
                                icon: Icons.people_outline,
                                title: 'Total Attempts',
                                value: _getTotalAttempts(_displayExam),
                                color: Colors.teal,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // Instructions
                        const Text(
                          'Instructions',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        _buildInstructionItem('Read each question carefully before answering'),
                        _buildInstructionItem('You can mark questions for review'),
                        _buildInstructionItem('Timer will start once you begin the test'),
                        _buildInstructionItem('Submit the test before time runs out'),
                        _buildInstructionItem('You cannot pause the test once started'),
                        
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Start Test Button
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
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: !_isLoading && _fullExamData['questionGroups'] != null
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ExamTakingScreen(exam: _fullExamData),
                            ),
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                    disabledBackgroundColor: Colors.grey[400],
                  ),
                  child: _isLoading
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Loading questions...',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        )
                      : const Text(
                          'START TEST',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
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
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 4),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: AppConstants.primaryColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(dynamic category) {
    if (category == null) return 'General';
    if (category is String) return category;
    if (category is Map) return category['name']?.toString() ?? 'General';
    return 'General';
  }

  String _getTotalQuestions(Map<String, dynamic> exam) {
    if (exam['questionGroups'] != null && exam['questionGroups'] is List) {
      int total = 0;
      final groups = exam['questionGroups'] as List;
      
      for (var group in groups) {
        if (group is Map) {
          // If group is populated (has questions array)
          if (group['questions'] != null && group['questions'] is List) {
            final questionCount = (group['questions'] as List).length;
            total += questionCount;
          }
        }
      }
      
      return total.toString();
    }
    
    return '0';
  }

  String _getTotalMarks(Map<String, dynamic> exam) {
    if (exam['questionGroups'] != null && exam['questionGroups'] is List) {
      int total = 0;
      for (var group in exam['questionGroups']) {
        if (group['questions'] != null && group['questions'] is List) {
          for (var question in group['questions']) {
            total += (question['marks'] as int? ?? 1);
          }
        }
      }
      return total.toString();
    }
    return '0';
  }

  String _getPassingMarks(Map<String, dynamic> exam) {
    final totalMarks = exam['totalMarks'] as int? ?? 0;
    final passingPercentage = exam['passingPercentage'] as int? ?? 40;
    
    if (totalMarks > 0) {
      final passingMarks = (totalMarks * passingPercentage / 100).ceil();
      return '$passingMarks ($passingPercentage%)';
    }
    return '0';
  }

  String _getMaxAttempts(Map<String, dynamic> exam) {
    final maxAttempts = exam['maxAttempts'] as int? ?? -1;
    if (maxAttempts == -1 || maxAttempts == 0) {
      return 'Unlimited';
    }
    return maxAttempts.toString();
  }

  String _getTotalAttempts(Map<String, dynamic> exam) {
    if (exam['attempts'] != null && exam['attempts'] is List) {
      return (exam['attempts'] as List).length.toString();
    }
    return '0';
  }
}
