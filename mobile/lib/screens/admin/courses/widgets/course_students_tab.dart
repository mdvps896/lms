import 'package:flutter/material.dart';

class CourseStudentsTab extends StatelessWidget {
  const CourseStudentsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) {
        return _buildStudentCard(index);
      },
    );
  }

  Widget _buildStudentCard(int index) {
    final students = [
      {'name': 'Rajesh Kumar', 'progress': 75, 'lastActive': '2 hours ago'},
      {'name': 'Priya Sharma', 'progress': 60, 'lastActive': '1 day ago'},
      {'name': 'Amit Patel', 'progress': 90, 'lastActive': '30 mins ago'},
    ];
    final student = students[index % students.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.blue.withOpacity(0.1),
            child: Text(
              student['name'].toString().substring(0, 1),
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name'].toString(),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Last active: ${student['lastActive']}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: LinearProgressIndicator(
                        value: (student['progress'] as int) / 100,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getProgressColor(student['progress'] as int),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${student['progress']}%',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getProgressColor(int progress) {
    if (progress >= 75) return Colors.green;
    if (progress >= 50) return Colors.orange;
    return Colors.red;
  }
}
