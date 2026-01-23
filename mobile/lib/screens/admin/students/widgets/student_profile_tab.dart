import 'package:flutter/material.dart';
import '../../shared/admin_widgets.dart';

class StudentProfileTab extends StatelessWidget {
  final Map<String, dynamic> student;

  const StudentProfileTab({super.key, required this.student});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile Header
          _buildProfileHeader(),
          const SizedBox(height: 20),
          
          // Exams Statistics
          _buildSectionTitle('Exam Statistics'),
          const SizedBox(height: 12),
          _buildExamStats(),
          const SizedBox(height: 20),
          
          // Identification & Account
          _buildSectionTitle('Identification & Account'),
          const SizedBox(height: 12),
          _buildInfoSection([
            _buildInfoRow('Roll Number', student['roll']),
            _buildInfoRow('Full Name', student['name']),
            _buildInfoRow('User ID', '6971e3dfddbc60feacd0461f'),
            _buildInfoRow('Register Source', '📱 Mobile App'),
            _buildInfoRow('Auth Method', 'google'),
            _buildInfoRow('Status', student['status']),
          ]),
          const SizedBox(height: 20),
          
          // Contact Details
          _buildSectionTitle('Contact Details'),
          const SizedBox(height: 12),
          _buildInfoSection([
            _buildInfoRow('Email Address', student['email']),
            _buildInfoRow('Phone Number', '+91 9876543210'),
            _buildInfoRow('Secondary Email', 'N/A'),
          ]),
          const SizedBox(height: 20),
          
          // Address Information
          _buildSectionTitle('Address Information'),
          const SizedBox(height: 12),
          _buildInfoSection([
            _buildInfoRow('Main Address', 'N/A'),
            _buildInfoRow('City', 'N/A'),
            _buildInfoRow('State', 'N/A'),
            _buildInfoRow('Pincode', 'N/A'),
          ]),
          const SizedBox(height: 20),
          
          // Academic Information
          _buildSectionTitle('Academic Information'),
          const SizedBox(height: 12),
          _buildInfoSection([
            _buildInfoRow('Profile Category', 'DHA'),
            _buildInfoRow('Educational Qualification', 'N/A'),
            _buildInfoRow('Gender', 'other'),
            _buildInfoRow('DOB', 'N/A'),
          ]),
          const SizedBox(height: 20),
          
          // Enrolled Courses
          _buildSectionTitle('Enrolled Courses'),
          const SizedBox(height: 12),
          _buildCourseCard('DHA', 'January 22, 2026 at 02:17 PM', 'January 30, 2026 at 02:17 PM'),
          const SizedBox(height: 20),
          
          // System Metrics
          _buildSectionTitle('System Metrics'),
          const SizedBox(height: 12),
          _buildInfoSection([
            _buildInfoRow('Joined Date', 'January 22, 2026 at 02:16 PM'),
            _buildInfoRow('Last Activity', 'January 22, 2026 at 08:08 PM'),
            _buildInfoRow('Updated On', 'January 22, 2026 at 08:08 PM'),
          ]),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: Colors.blue.withOpacity(0.1),
            child: Text(
              student['name'].toString().substring(0, 1).toUpperCase(),
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            student['name'],
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            student['email'],
            style: const TextStyle(
              fontSize: 16,
              color: Colors.black54,
            ),
          ),
          const SizedBox(height: 16),
          StatusBadge(
            label: student['status'],
            color: student['status'] == 'Active' ? Colors.green : Colors.red,
          ),
        ],
      ),
    );
  }

  Widget _buildExamStats() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard('Exams Taken', '0', Colors.blue),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard('Successful', '0', Colors.green),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard('Success Rate', '0%', Colors.orange),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
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
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black54,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(List<Widget> rows) {
    return Container(
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
      child: Column(
        children: rows,
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black54,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseCard(String courseName, String startDate, String endDate) {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.book, color: Colors.blue, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  courseName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  startDate,
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.event, size: 14, color: Colors.grey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  endDate,
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
