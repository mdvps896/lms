import 'package:flutter/material.dart';

class CourseSettingsTab extends StatefulWidget {
  final Map<String, dynamic> course;

  const CourseSettingsTab({super.key, required this.course});

  @override
  State<CourseSettingsTab> createState() => _CourseSettingsTabState();
}

class _CourseSettingsTabState extends State<CourseSettingsTab> {
  bool _isPublished = true;
  bool _allowComments = true;
  bool _certificateEnabled = true;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSettingCard(
          'Course Status',
          'Publish or unpublish this course',
          Switch(
            value: _isPublished,
            onChanged: (value) {
              setState(() {
                _isPublished = value;
              });
            },
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingCard(
          'Allow Comments',
          'Enable student comments and discussions',
          Switch(
            value: _allowComments,
            onChanged: (value) {
              setState(() {
                _allowComments = value;
              });
            },
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingCard(
          'Certificate',
          'Issue certificate upon completion',
          Switch(
            value: _certificateEnabled,
            onChanged: (value) {
              setState(() {
                _certificateEnabled = value;
              });
            },
          ),
        ),
        const SizedBox(height: 24),
        _buildActionButton(
          'Edit Course Details',
          Icons.edit,
          Colors.blue,
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Edit functionality coming soon')),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildActionButton(
          'Duplicate Course',
          Icons.copy,
          Colors.orange,
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Course duplicated')),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildActionButton(
          'Delete Course',
          Icons.delete,
          Colors.red,
          () {
            _showDeleteDialog();
          },
        ),
      ],
    );
  }

  Widget _buildSettingCard(String title, String subtitle, Widget trailing) {
    return Container(
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
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
            Icon(icon, color: color),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Course'),
        content: const Text('Are you sure you want to delete this course? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Course deleted successfully')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
