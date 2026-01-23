import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../widgets/free_materials_skeleton.dart';
import '../../exam/exam_detail_screen.dart';

class FreeTestsTab extends StatefulWidget {
  final String searchQuery;

  const FreeTestsTab({super.key, required this.searchQuery});

  @override
  State<FreeTestsTab> createState() => _FreeTestsTabState();
}

class _FreeTestsTabState extends State<FreeTestsTab> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _tests = [];
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    _fetchTests();
  }

  @override
  void didUpdateWidget(FreeTestsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _fetchTests();
    }
  }

  Future<void> _fetchTests() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      print('Starting _fetchTests...');
      // Fetch specifically Free Materials of type 'test'
      final materials = await _apiService.getFreeMaterials();
      print('Received materials in FreeTestsTab: ${materials.length}');
      
      List<Map<String, dynamic>> testItems = [];

      for (var material in materials) {
        print('Checking material: ${material['title']}, type: ${material['type']}, testId: ${material['testId']}');
        
        if (material['type'] == 'test' && material['testId'] != null) {
          final test = material['testId'];
          // Handle case where testId might be a String ID (if populate failed) or Map (if populated)
          if (test is Map) {
             print('Adding test: ${test['title'] ?? material['title']}');
             testItems.add({
              'id': test['_id'],
              'title': test['title'] ?? material['title'], 
              'questions': '${test['questions']?.length ?? 0} questions',
              'duration': '${test['duration'] ?? 60} min',
              'difficulty': 'Intermediate', 
              'category': material['category']?['name'] ?? 'General',
              'createdAt': material['createdAt'],
              'status': 'Free',
            });
          } else {
             print('Skipping test because testId is not a Map: $test');
          }
        }
      }

      // Filter by search query
      if (widget.searchQuery.isNotEmpty) {
        testItems =
            testItems
                .where(
                  (t) =>
                      t['title'].toString().toLowerCase().contains(
                        widget.searchQuery.toLowerCase(),
                      ) ||
                      t['category'].toString().toLowerCase().contains(
                        widget.searchQuery.toLowerCase(),
                      ),
                )
                .toList();
      }

      print('Final testItems count: ${testItems.length}');
      _applySorting(testItems);

      if (mounted) {
        setState(() {
          _tests = testItems;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      print('Error loading free tests: $e');
    }
  }

  void _applySorting(List<Map<String, dynamic>> tests) {
    if (_sortBy == 'newest') {
      tests.sort(
        (a, b) =>
            b['createdAt'].toString().compareTo(a['createdAt'].toString()),
      );
    } else {
      tests.sort(
        (a, b) =>
            a['createdAt'].toString().compareTo(b['createdAt'].toString()),
      );
    }
  }

  void _changeSorting(String sortBy) {
    setState(() {
      _sortBy = sortBy;
      _applySorting(_tests);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const FreeMaterialsSkeleton();
    }

    return RefreshIndicator(
      onRefresh: _fetchTests,
      color: AppConstants.primaryColor,
      child: Column(
        children: [
          // Sort options
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text(
                  'Sort by:',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(width: 12),
                _buildSortChip('Newest', 'newest'),
                const SizedBox(width: 8),
                _buildSortChip('Oldest', 'oldest'),
              ],
            ),
          ),

          // Tests list
          Expanded(
            child:
                _tests.isEmpty
                    ? ListView(
                      children: [
                        Padding(
                          padding: EdgeInsets.only(
                            top: MediaQuery.of(context).size.height * 0.2,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.quiz_outlined,
                                size: 80,
                                color: Colors.grey[300],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No tests found',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                    : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _tests.length,
                      itemBuilder: (context, index) {
                        final test = _tests[index];
                        return _buildTestItem(test);
                      },
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
    return InkWell(
      onTap: () => _changeSorting(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppConstants.primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : Colors.grey[700],
          ),
        ),
      ),
    );
  }

  Widget _buildTestItem(Map<String, dynamic> test) {
    Color difficultyColor;
    switch (test['difficulty']) {
      case 'Beginner':
        difficultyColor = Colors.green;
        break;
      case 'Intermediate':
        difficultyColor = Colors.orange;
        break;
      case 'Advanced':
        difficultyColor = Colors.red;
        break;
      default:
        difficultyColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: InkWell(
        onTap: () async {
          // Navigate immediately with basic data
          Navigator.push(
            context,
            MaterialPageRoute(
              builder:
                  (context) => ExamDetailScreen(
                    exam: {
                      'title': test['title'],
                      'name': test['title'],
                      'category': test['category'],
                      'duration':
                          int.tryParse(
                            test['duration'].toString().replaceAll(' min', ''),
                          ) ??
                          60,
                      'maxAttempts': 3,
                      '_id': test['id'],
                    },
                    examId: test['id'],
                  ),
            ),
          );
        },
        child: Row(
          children: [
            // Quiz icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppConstants.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.quiz,
                color: AppConstants.primaryColor,
                size: 28,
              ),
            ),

            const SizedBox(width: 12),

            // Test info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          test['title'],
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppConstants.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: test['status'] == 'LIVE' ? Colors.green : Colors.blue,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          test['status'],
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: difficultyColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          test['difficulty'],
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: difficultyColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        test['category'],
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      const Spacer(),
                      const Icon(
                        Icons.timer_outlined,
                        size: 14,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        test['duration'],
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
