import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart';
import 'result_detail_screen.dart';

class MyResultsScreen extends StatefulWidget {
  const MyResultsScreen({super.key});

  @override
  State<MyResultsScreen> createState() => _MyResultsScreenState();
}

class _MyResultsScreenState extends State<MyResultsScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _attempts = [];
  List<Map<String, dynamic>> _groupedExams = [];
  String _sortOrder = 'newest'; // 'newest' or 'oldest'
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAttempts();
  }

  Future<void> _fetchAttempts() async {
    setState(() => _isLoading = true);
    try {
      final attempts = await _apiService.getMyExamAttempts();
      if (mounted) {
        setState(() {
          _attempts = attempts;
          _groupAttemptsByExam();
          _isLoading = false;
        });
      }
    } catch (e) {

      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _groupAttemptsByExam() {
    // Group attempts by exam
    Map<String, List<Map<String, dynamic>>> examGroups = {};

    for (var attempt in _attempts) {
      final examData = attempt['exam'];
      final examId = examData is Map ? examData['_id'] : 'unknown';
      final examName =
          examData is Map
              ? (examData['name'] ?? 'Unknown Test')
              : 'Unknown Test';

      if (!examGroups.containsKey(examId)) {
        examGroups[examId] = [];
      }
      examGroups[examId]!.add(attempt);
    }

    // Convert to list and sort each group's attempts
    _groupedExams =
        examGroups.entries.map((entry) {
          final examData = entry.value.first['exam'];
          final attempts = List<Map<String, dynamic>>.from(entry.value);

          // Sort attempts based on selected order
          attempts.sort((a, b) {
            final dateA =
                DateTime.tryParse(a['submittedAt'] ?? '') ?? DateTime.now();
            final dateB =
                DateTime.tryParse(b['submittedAt'] ?? '') ?? DateTime.now();
            return _sortOrder == 'newest'
                ? dateB.compareTo(dateA)
                : dateA.compareTo(dateB);
          });

          return {
            'examId': entry.key,
            'examName':
                examData is Map
                    ? (examData['name'] ?? 'Unknown Test')
                    : 'Unknown Test',
            'attempts': attempts,
          };
        }).toList();

    // Sort exams by latest attempt
    _groupedExams.sort((a, b) {
      final latestA =
          DateTime.tryParse(a['attempts'][0]['submittedAt'] ?? '') ??
          DateTime.now();
      final latestB =
          DateTime.tryParse(b['attempts'][0]['submittedAt'] ?? '') ??
          DateTime.now();
      return _sortOrder == 'newest'
          ? latestB.compareTo(latestA)
          : latestA.compareTo(latestB);
    });
  }

  void _toggleSortOrder() {
    setState(() {
      _sortOrder = _sortOrder == 'newest' ? 'oldest' : 'newest';
      _groupAttemptsByExam();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryColor,
        title: const Text(
          'My Results',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort, color: Colors.white),
            onSelected: (value) {
              if (value != _sortOrder) {
                _toggleSortOrder();
              }
            },
            itemBuilder:
                (context) => [
                  PopupMenuItem(
                    value: 'newest',
                    child: Row(
                      children: [
                        Icon(
                          Icons.arrow_downward,
                          color:
                              _sortOrder == 'newest'
                                  ? AppConstants.primaryColor
                                  : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Newest First',
                          style: TextStyle(
                            color:
                                _sortOrder == 'newest'
                                    ? AppConstants.primaryColor
                                    : Colors.black,
                            fontWeight:
                                _sortOrder == 'newest'
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'oldest',
                    child: Row(
                      children: [
                        Icon(
                          Icons.arrow_upward,
                          color:
                              _sortOrder == 'oldest'
                                  ? AppConstants.primaryColor
                                  : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Oldest First',
                          style: TextStyle(
                            color:
                                _sortOrder == 'oldest'
                                    ? AppConstants.primaryColor
                                    : Colors.black,
                            fontWeight:
                                _sortOrder == 'oldest'
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
          ),
        ],
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _groupedExams.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                onRefresh: _fetchAttempts,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _groupedExams.length,
                  itemBuilder: (context, index) {
                    final examGroup = _groupedExams[index];
                    return _buildExamGroupCard(examGroup);
                  },
                ),
              ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assessment_outlined, size: 100, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No exam attempts yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Take a test to see your results here',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildExamGroupCard(Map<String, dynamic> examGroup) {
    final examName = examGroup['examName'];
    final attempts = examGroup['attempts'] as List;
    final latestAttempt = attempts.first;
    final latestScore = latestAttempt['score'] ?? 0;
    final latestTotalMarks = latestAttempt['totalMarks'] ?? 100;
    final latestPassed = latestAttempt['passed'] ?? false;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          childrenPadding: EdgeInsets.zero,
          leading: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.assignment,
              color: AppConstants.primaryColor,
              size: 28,
            ),
          ),
          title: Text(
            examName,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${attempts.length} ${attempts.length == 1 ? 'Attempt' : 'Attempts'}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.stars, size: 12, color: Colors.orange),
                const SizedBox(width: 2),
                Text(
                  'Latest: $latestScore/$latestTotalMarks',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: latestPassed ? Colors.green : Colors.red,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    latestPassed ? 'PASS' : 'FAIL',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    child: Row(
                      children: [
                        Icon(Icons.history, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          'All Attempts',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                  ),
                  ...List.generate(attempts.length, (index) {
                    return _buildAttemptItem(
                      attempts[index],
                      index + 1,
                      index == attempts.length - 1,
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttemptItem(
    Map<String, dynamic> attempt,
    int attemptNumber,
    bool isLast,
  ) {
    final score = attempt['score'] ?? 0;
    final totalMarks = attempt['totalMarks'] ?? 100;
    final percentage = totalMarks > 0 ? (score / totalMarks * 100) : 0;
    final passed = attempt['passed'] ?? false;
    final timeTaken = attempt['timeTaken'] ?? 0;
    final submittedAt = DateTime.tryParse(attempt['submittedAt'] ?? '');

    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom:
              isLast ? BorderSide.none : BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color:
                passed
                    ? Colors.green.withValues(alpha: 0.1)
                    : Colors.red.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '#$attemptNumber',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: passed ? Colors.green : Colors.red,
                ),
              ),
              Text(
                passed ? 'PASS' : 'FAIL',
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: passed ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
        ),
        title: Row(
          children: [
            Icon(Icons.stars, size: 16, color: Colors.orange),
            const SizedBox(width: 4),
            Text(
              '$score/$totalMarks',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Text(
              '(${percentage.toStringAsFixed(1)}%)',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
        subtitle: Row(
          children: [
            Icon(Icons.timer, size: 14, color: Colors.blue),
            const SizedBox(width: 4),
            Text(_formatTime(timeTaken), style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 12),
            if (submittedAt != null) ...[
              Icon(Icons.calendar_today, size: 14, color: Colors.purple),
              const SizedBox(width: 4),
              Text(
                '${submittedAt.day}/${submittedAt.month}/${submittedAt.year}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.visibility, color: AppConstants.primaryColor),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ResultDetailScreen(attempt: attempt),
              ),
            );
          },
        ),
      ),
    );
  }

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int secs = seconds % 60;
    return '${minutes}m ${secs}s';
  }
}
