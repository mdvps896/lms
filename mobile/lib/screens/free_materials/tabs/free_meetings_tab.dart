import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../widgets/free_materials_skeleton.dart';

class FreeMeetingsTab extends StatefulWidget {
  final String searchQuery;

  const FreeMeetingsTab({super.key, required this.searchQuery});

  @override
  State<FreeMeetingsTab> createState() => _FreeMeetingsTabState();
}

class _FreeMeetingsTabState extends State<FreeMeetingsTab> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isOpeningMeeting = false;
  List<Map<String, dynamic>> _meetings = [];
  String _sortBy = 'newest';


  @override
  void initState() {
    super.initState();
    _fetchMeetings();
  }

  @override
  void didUpdateWidget(FreeMeetingsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _fetchMeetings();
    }
  }

  Future<void> _fetchMeetings() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    
    try {
      final meetings = await _apiService.getMeetings();
      final user = await _apiService.getSavedUser();
      
      List<Map<String, dynamic>> meetingItems = [];
      
      for (var meeting in meetings) {
        final startTime = DateTime.tryParse(meeting['startTime'] ?? '') ?? DateTime.now();
        final endTime = DateTime.tryParse(meeting['endTime'] ?? '') ?? DateTime.now();
        final now = DateTime.now();
        
        // Determine meeting status
        String status;
        if (now.isBefore(startTime)) {
          status = 'UPCOMING';
        } else if (now.isAfter(endTime)) {
          status = 'EXPIRED';
        } else {
          status = 'LIVE';
        }
        
        // Extract meeting link
        String meetingLink = '';
        if (meeting['links'] != null && (meeting['links'] as List).isNotEmpty) {
          final firstLink = meeting['links'][0];
          if (firstLink is Map) {
            meetingLink = firstLink['url']?.toString() ?? '';
          } else if (firstLink is String) {
            meetingLink = firstLink;
          }
        }
        
        final meetingCategory = meeting['category'];
        final meetingCategoryId = meetingCategory?['_id'];
        final meetingCategoryName = meetingCategory?['name'] ?? 'General';
        
        // Filter by user category (students see ONLY their category meetings)
        if (user != null && user.role == 'student') {
          final userCategoryId = user.category; // This is the category ID
          
          if (userCategoryId != null && userCategoryId.toString().isNotEmpty) {
            // Compare category IDs
            if (meetingCategoryId != userCategoryId) {
              continue; // Skip this meeting
            }
          }
        }
        
        meetingItems.add({
          'id': meeting['_id'],
          'title': meeting['title'],
          'date': DateFormat('MMM dd, yyyy').format(startTime),
          'time': '${DateFormat('hh:mm a').format(startTime)} - ${DateFormat('hh:mm a').format(endTime)}',
          'duration': '${endTime.difference(startTime).inMinutes} mins',
          'host': 'Admin',
          'meetingLink': meetingLink,
          'category': meetingCategoryName,
          'createdAt': meeting['createdAt'],
          'status': status,
          'startTime': startTime,
          'endTime': endTime,
        });
      }

      // Filter by search query
      if (widget.searchQuery.isNotEmpty) {
        meetingItems = meetingItems.where((m) => 
          m['title'].toString().toLowerCase().contains(widget.searchQuery.toLowerCase()) ||
          m['category'].toString().toLowerCase().contains(widget.searchQuery.toLowerCase())
        ).toList();
      }

      _applySorting(meetingItems);
      
      if (mounted) {
        setState(() {
          _meetings = meetingItems;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applySorting(List<Map<String, dynamic>> meetings) {
    if (_sortBy == 'newest') {
      meetings.sort((a, b) => b['createdAt'].toString().compareTo(a['createdAt'].toString()));
    } else {
      meetings.sort((a, b) => a['createdAt'].toString().compareTo(b['createdAt'].toString()));
    }
  }

  void _changeSorting(String sortBy) {
    setState(() {
      _sortBy = sortBy;
      _applySorting(_meetings);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const FreeMaterialsSkeleton();
    }

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _fetchMeetings,
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

          // Meetings list
          Expanded(
            child: _meetings.isEmpty
                ? ListView(
                    children: [
                      Padding(
                        padding: EdgeInsets.only(top: MediaQuery.of(context).size.height * 0.2),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.video_call_outlined, size: 80, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text(
                              'No meetings found',
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
                    itemCount: _meetings.length,
                    itemBuilder: (context, index) {
                      final meeting = _meetings[index];
                      return _buildMeetingItem(meeting);
                    },
                  ),
          ),
        ],
      ),
        ),
        // Loading overlay
        if (_isOpeningMeeting)
          Container(
            color: Colors.black.withOpacity(0.5),
            child: const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          ),
      ],
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

  Widget _buildMeetingItem(Map<String, dynamic> meeting) {
    final status = meeting['status'] ?? 'UPCOMING';
    final isLive = status == 'LIVE';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: InkWell(
        onTap: isLive ? () async {
          final meetingLink = meeting['meetingLink'] ?? '';
          
          if (meetingLink.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('No meeting link available'),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }

          // Show loading indicator
          setState(() => _isOpeningMeeting = true);

          try {
            final uri = Uri.parse(meetingLink);
            
            // Use platformDefault to let user choose browser
            if (await canLaunchUrl(uri)) {
              await launchUrl(
                uri,
                mode: LaunchMode.platformDefault,
              );
            } else {
              throw 'Could not launch meeting link';
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to open meeting: $e'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          } finally {
            // Hide loading indicator
            if (mounted) {
              setState(() => _isOpeningMeeting = false);
            }
          }
        } : () {
          // Show message for non-live meetings
          String message;
          if (status == 'UPCOMING') {
            message = 'This meeting hasn\'t started yet';
          } else {
            message = 'This meeting has ended';
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 2),
            ),
          );
        },
        child: Row(
          children: [
            // Google Meet logo
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey[200]!, width: 1),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(
                  'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png',
                  width: 56,
                  height: 56,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback to icon if image fails to load
                    return const Icon(
                      Icons.video_call,
                      color: Colors.green,
                      size: 28,
                    );
                  },
                ),
              ),
            ),
            
            const SizedBox(width: 12),
            
            // Meeting info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          meeting['title'],
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
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: status == 'LIVE' 
                              ? Colors.red[50] 
                              : status == 'UPCOMING'
                                  ? Colors.blue[50]
                                  : Colors.grey[200],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: status == 'LIVE'
                                ? Colors.red
                                : status == 'UPCOMING'
                                    ? Colors.blue
                                    : Colors.grey[600],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.category_outlined, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        meeting['category'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${meeting['date']} • ${meeting['time']}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
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
