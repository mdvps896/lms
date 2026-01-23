import 'package:flutter/material.dart';
import '../../../utils/constants.dart';

class QuestionNavigator extends StatefulWidget {
  final int totalQuestions;
  final int currentIndex;
  final Set<int> answeredQuestions;
  final Set<int> markedQuestions;
  final Function(int) onQuestionTap;
  final List<Map<String, dynamic>> questions;

  const QuestionNavigator({
    super.key,
    required this.totalQuestions,
    required this.currentIndex,
    required this.answeredQuestions,
    required this.markedQuestions,
    required this.onQuestionTap,
    required this.questions,
  });

  @override
  State<QuestionNavigator> createState() => _QuestionNavigatorState();
}

class _QuestionNavigatorState extends State<QuestionNavigator>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<String> _groupNames = [];
  Map<String, List<int>> _groupQuestions = {};

  @override
  void initState() {
    super.initState();
    _organizeQuestionsByGroup();
    _tabController = TabController(length: _groupNames.length, vsync: this);
    
    // Find which tab contains the current question and switch to it
    for (int i = 0; i < _groupNames.length; i++) {
      if (_groupQuestions[_groupNames[i]]!.contains(widget.currentIndex)) {
        _tabController.index = i;
        break;
      }
    }
  }

  void _organizeQuestionsByGroup() {
    Map<String, List<int>> groups = {};
    
    for (int i = 0; i < widget.questions.length; i++) {
      final groupName = widget.questions[i]['groupName'] ?? 'General';
      if (!groups.containsKey(groupName)) {
        groups[groupName] = [];
      }
      groups[groupName]!.add(i);
    }
    
    setState(() {
      _groupNames = groups.keys.toList();
      _groupQuestions = groups;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

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
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: 16,
              runSpacing: 8,
              children: [
                _buildLegendItem(
                  color: AppConstants.primaryColor,
                  label: 'Current',
                ),
                _buildLegendItem(color: Colors.green, label: 'Answered'),
                _buildLegendItem(color: Colors.orange, label: 'Marked'),
                _buildLegendItem(
                  color: Colors.grey[300]!,
                  label: 'Not Visited',
                  textColor: Colors.grey[700]!,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Group Tabs
          if (_groupNames.length > 1)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                indicator: BoxDecoration(
                  color: AppConstants.primaryColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                labelColor: Colors.white,
                unselectedLabelColor: Colors.grey[700],
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                tabs: _groupNames
                    .map((name) => Tab(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(name),
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '${_groupQuestions[name]!.length}',
                                  style: const TextStyle(fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                        ))
                    .toList(),
              ),
            ),

          const SizedBox(height: 16),

          // Question grid
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _groupNames.map((groupName) {
                final questionIndices = _groupQuestions[groupName]!;
                return GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 5,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1,
                  ),
                  itemCount: questionIndices.length,
                  itemBuilder: (context, index) {
                    final questionIndex = questionIndices[index];
                    final isCurrent = questionIndex == widget.currentIndex;
                    final isAnswered =
                        widget.answeredQuestions.contains(questionIndex);
                    final isMarked =
                        widget.markedQuestions.contains(questionIndex);

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
                      onTap: () => widget.onQuestionTap(questionIndex),
                      child: Container(
                        decoration: BoxDecoration(
                          color: backgroundColor,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: isCurrent
                              ? [
                                  BoxShadow(
                                    color: AppConstants.primaryColor
                                        .withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            '${questionIndex + 1}',
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
                );
              }).toList(),
            ),
          ),

          // Summary
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem(
                  'Total',
                  widget.totalQuestions.toString(),
                  Colors.blue,
                ),
                _buildSummaryItem(
                  'Answered',
                  widget.answeredQuestions.length.toString(),
                  Colors.green,
                ),
                _buildSummaryItem(
                  'Marked',
                  widget.markedQuestions.length.toString(),
                  Colors.orange,
                ),
                _buildSummaryItem(
                  'Not Answered',
                  (widget.totalQuestions - widget.answeredQuestions.length)
                      .toString(),
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
      mainAxisSize: MainAxisSize.min,
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
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }
}
