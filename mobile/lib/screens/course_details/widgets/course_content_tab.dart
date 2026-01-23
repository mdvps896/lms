import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../../lecture_player/lecture_player_screen.dart';
import '../../pdf_viewer/pdf_viewer_screen.dart';
import '../../exam/exam_detail_screen.dart';

class CourseContentTab extends StatefulWidget {
  final Map<String, dynamic> course;
  final bool isEnrolled;

  const CourseContentTab({
    super.key,
    required this.course,
    this.isEnrolled = false,
  });

  @override
  State<CourseContentTab> createState() => _CourseContentTabState();
}

class _CourseContentTabState extends State<CourseContentTab> {
  int? _expandedIndex;

  @override
  Widget build(BuildContext context) {
    final curriculum = widget.course['curriculum'] as List<dynamic>? ?? [];
    final exams = widget.course['exams'] as List<dynamic>? ?? [];
    final isFree = widget.course['isFree'] ?? false;
    final hasExams = exams.isNotEmpty;

    if (curriculum.isEmpty && exams.isEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.4,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.folder_open, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No content available yet',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: curriculum.length + (hasExams ? 1 : 0) + 1,
      itemBuilder: (context, index) {
        // Render Topics
        if (index < curriculum.length) {
          final topic = curriculum[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildTopicSection(context, topic, isFree, index),
          );
        }

        // Render Exams Section
        if (hasExams && index == curriculum.length) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildExamSection(context, exams, isFree, index),
          );
        }

        return const SizedBox(height: 80);
      },
    );
  }

  Widget _buildTopicSection(
    BuildContext context,
    Map<String, dynamic> topic,
    bool isCourseFree,
    int index,
  ) {
    final topicTitle = topic['title'] ?? 'Untitled Topic';
    final lectures = topic['lectures'] as List<dynamic>? ?? [];
    final lectureCount = lectures.length;
    final durationText = '$lectureCount Lesson${lectureCount != 1 ? 's' : ''}';
    final isExpanded = _expandedIndex == index;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ExpansionTile(
        key: ValueKey('topic_${index}_$isExpanded'),
        initiallyExpanded: isExpanded,
        onExpansionChanged: (expanded) {
          setState(() {
            if (expanded) {
              _expandedIndex = index;
            } else if (_expandedIndex == index) {
              _expandedIndex = null;
            }
          });
        },
        shape: const Border(),
        collapsedShape: const Border(),
        title: Text(
          topicTitle,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppConstants.textPrimary,
          ),
        ),
        subtitle: Text(
          durationText,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        children: lectures.map((lecture) {
          return _buildLectureItem(context, lecture, isCourseFree);
        }).toList(),
      ),
    );
  }

  Widget _buildExamSection(
    BuildContext context,
    List<dynamic> exams,
    bool isCourseFree,
    int index,
  ) {
    final examCount = exams.length;
    final subtitle = '$examCount Exam${examCount != 1 ? 's' : ''}';
    final isExpanded = _expandedIndex == index;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ExpansionTile(
        key: ValueKey('exam_${index}_$isExpanded'),
        initiallyExpanded: isExpanded,
        onExpansionChanged: (expanded) {
          setState(() {
            if (expanded) {
              _expandedIndex = index;
            } else if (_expandedIndex == index) {
              _expandedIndex = null;
            }
          });
        },
        shape: const Border(),
        collapsedShape: const Border(),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.assignment_rounded,
            color: Colors.blue,
            size: 20,
          ),
        ),
        title: const Text(
          'Course Exams',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppConstants.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        children: exams.map((exam) {
          return _buildExamItem(context, exam, isCourseFree);
        }).toList(),
      ),
    );
  }

  Widget _buildExamItem(
    BuildContext context,
    Map<String, dynamic> exam,
    bool isCourseFree,
  ) {
    // Safely extract properties
    final examTitle = exam['name'] ?? 'Untitled Exam';
    final examType = exam['type'] ?? 'regular';
    final duration = exam['duration'] ?? 0;

    // Determine if exam is unlocked
    final isUnlocked = isCourseFree || widget.isEnrolled;

    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color:
              isUnlocked
                  ? Colors.blue.withValues(alpha: 0.1)
                  : Colors.grey[100],
          shape: BoxShape.circle,
        ),
        child: Icon(
          isUnlocked ? Icons.quiz_rounded : Icons.lock_rounded,
          size: 20,
          color: isUnlocked ? Colors.blue : Colors.grey,
        ),
      ),
      title: Text(
        examTitle,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: isUnlocked ? AppConstants.textPrimary : Colors.grey[400],
        ),
      ),
      subtitle: Row(
        children: [
          Icon(Icons.timer_outlined, size: 12, color: Colors.grey[500]),
          const SizedBox(width: 4),
          Text(
            '$duration mins',
            style: TextStyle(fontSize: 11, color: Colors.grey[500]),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              examType.toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[600],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: isUnlocked ? Colors.blue : Colors.grey[300],
        size: 20,
      ),
      onTap: () {
        if (!isUnlocked) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.lock, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Enroll in this course to take the exam!",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              margin: EdgeInsets.all(20),
            ),
          );
        } else {
          // Navigate to Exam Detail
          // Note: exam object might need id mapping if keys vary
          final examId = exam['_id'] ?? exam['id'];
          if (examId != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder:
                    (context) =>
                        ExamDetailScreen(exam: exam, examId: examId.toString()),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Error: Invalid Exam ID')),
            );
          }
        }
      },
    );
  }

  Widget _buildLectureItem(
    BuildContext context,
    Map<String, dynamic> lecture,
    bool isCourseFree,
  ) {
    final lectureTitle = lecture['title'] ?? 'Untitled Lecture';
    final lectureType = lecture['type'] ?? 'video';
    final isDemo = lecture['isDemo'] ?? false;

    // Determine if lecture is unlocked
    // Unlock if: course is free OR lecture is marked as demo
    final isUnlocked = isCourseFree || isDemo || widget.isEnrolled;

    // Get icon based on type
    IconData getIcon() {
      if (!isUnlocked) return Icons.lock_rounded;

      switch (lectureType.toLowerCase()) {
        case 'video':
          return Icons.play_circle_outline;
        case 'pdf':
          return Icons.picture_as_pdf;
        case 'document':
          return Icons.description;
        default:
          return Icons.play_arrow_rounded;
      }
    }

    // Get color based on unlock status
    Color getColor() {
      if (!isUnlocked) return Colors.grey;

      switch (lectureType.toLowerCase()) {
        case 'video':
          return AppConstants.accentColor;
        case 'pdf':
          return Colors.red;
        case 'document':
          return Colors.blue;
        default:
          return AppConstants.primaryColor;
      }
    }

    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color:
              isUnlocked ? getColor().withValues(alpha: 0.1) : Colors.grey[100],
          shape: BoxShape.circle,
        ),
        child: Icon(getIcon(), size: 20, color: getColor()),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              lectureTitle,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isUnlocked ? AppConstants.textPrimary : Colors.grey[400],
              ),
            ),
          ),
          if (isDemo && !isCourseFree)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
              ),
              child: const Text(
                'FREE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ),
        ],
      ),
      subtitle: Text(
        lectureType.toUpperCase(),
        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: isUnlocked ? AppConstants.primaryColor : Colors.grey[300],
        size: 20,
      ),
      onTap: () {
        if (!isUnlocked) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.lock, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Purchase this course to access this content!",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              margin: EdgeInsets.all(20),
            ),
          );
        } else {
          // Open lecture content
          final courseId = widget.course['_id'] ?? widget.course['id'];
          _openLectureContent(context, lecture, courseId?.toString());
        }
      },
    );
  }

  void _openLectureContent(
    BuildContext context,
    Map<String, dynamic> lecture,
    String? courseId,
  ) {

    final lectureType = lecture['type'] ?? 'video';
    final lectureId = lecture['_id'] ?? lecture['id'];

    if (courseId != null && lectureId != null && widget.isEnrolled) {
      // Track progress in background
      ApiService().updateCourseProgress(courseId, lectureId.toString());
    }

    if (lectureType.toLowerCase() == 'video') {
      // Navigate to video player
      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => LecturePlayerScreen(
                lecture: lecture,
                courseTitle: widget.course['title'] ?? 'Course',
                courseId: courseId ?? '',
              ),
        ),
      );
    } else if (lectureType.toLowerCase() == 'pdf') {
      // Navigate to PDF viewer
      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => PdfViewerScreen(
                lecture: lecture,
                courseTitle: widget.course['title'] ?? 'Course',
                courseId: courseId ?? '',
              ),
        ),
      );
    } else {
      // Other types
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Opening ${lecture['title']} ($lectureType)'),
          backgroundColor: AppConstants.primaryColor,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(20),
        ),
      );
    }
  }
}
