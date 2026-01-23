import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../widgets/free_materials_skeleton.dart';
import '../../lecture_player/lecture_player_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class VideosTab extends StatefulWidget {
  final String searchQuery;

  const VideosTab({super.key, required this.searchQuery});

  @override
  State<VideosTab> createState() => _VideosTabState();
}

class _VideosTabState extends State<VideosTab> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  Map<String, List<Map<String, dynamic>>> _videosByCategory = {};
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    _fetchVideos();
  }

  @override
  void didUpdateWidget(VideosTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _fetchVideos();
    }
  }

  Future<void> _fetchVideos() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final materials = await _apiService.getFreeMaterials();
      List<Map<String, dynamic>> videoItems = [];

      for (var material in materials) {
        if (material['files'] != null) {
          for (var file in material['files']) {
            final url = file['url'].toString().toLowerCase();
            final type = file['type']?.toString().toLowerCase() ?? '';
            final vidExts = [
              '.mp4',
              '.mkv',
              '.avi',
              '.webm',
              '.mov',
              '.3gp',
              '.flv',
              '.m4v',
            ];
            final isVideo =
                vidExts.any((ext) => url.endsWith(ext)) ||
                type == 'video' ||
                url.contains('youtube.com') ||
                url.contains('youtu.be');

            if (isVideo) {
              videoItems.add({
                'id': material['_id'],
                'title': file['title'] ?? material['title'],
                'duration': 'Watch Now', // We don't have duration in schema yet
                'thumbnail': _formatImageUrl(file['url']), // Simplified
                'videoUrl': file['url'],
                'category': material['category']?['name'] ?? 'General',
                'views': 'Free',
                'createdAt': material['createdAt'],
              });
            }
          }
        }
      }

      // Filter by search query
      if (widget.searchQuery.isNotEmpty) {
        videoItems =
            videoItems
                .where(
                  (v) =>
                      v['title'].toString().toLowerCase().contains(
                        widget.searchQuery.toLowerCase(),
                      ) ||
                      v['category'].toString().toLowerCase().contains(
                        widget.searchQuery.toLowerCase(),
                      ),
                )
                .toList();
      }

      _applySorting(videoItems);
      _groupByCategory(videoItems);

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applySorting(List<Map<String, dynamic>> videos) {
    if (_sortBy == 'newest') {
      videos.sort(
        (a, b) =>
            b['createdAt'].toString().compareTo(a['createdAt'].toString()),
      );
    } else {
      videos.sort(
        (a, b) =>
            a['createdAt'].toString().compareTo(b['createdAt'].toString()),
      );
    }
  }

  void _groupByCategory(List<Map<String, dynamic>> videos) {
    _videosByCategory = {};
    for (var video in videos) {
      final category = video['category'] as String;
      if (!_videosByCategory.containsKey(category)) {
        _videosByCategory[category] = [];
      }
      _videosByCategory[category]!.add(video);
    }
  }

  void _changeSorting(String sortBy) {
    setState(() {
      _sortBy = sortBy;
      var allVideos = _videosByCategory.values.expand((v) => v).toList();
      _applySorting(allVideos);
      _groupByCategory(allVideos);
    });
  }

  String _formatImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    return '${_apiService.serverUrl}$url';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const FreeMaterialsSkeleton();
    }

    return RefreshIndicator(
      onRefresh: _fetchVideos,
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

          // Videos list grouped by category
          Expanded(
            child:
                _videosByCategory.isEmpty
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
                                Icons.video_library_outlined,
                                size: 80,
                                color: Colors.grey[300],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No videos found',
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
                      itemCount: _videosByCategory.length,
                      itemBuilder: (context, index) {
                        final category = _videosByCategory.keys.elementAt(
                          index,
                        );
                        final videos = _videosByCategory[category]!;
                        return _buildCategorySection(category, videos);
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

  Widget _buildCategorySection(
    String category,
    List<Map<String, dynamic>> videos,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header (folder)
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 12),
          child: Row(
            children: [
              Icon(Icons.folder, color: AppConstants.primaryColor, size: 24),
              const SizedBox(width: 8),
              Text(
                category,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppConstants.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${videos.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Videos in this category
        ...videos.map((video) => _buildVideoItem(video)),

        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildVideoItem(Map<String, dynamic> video) {
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
          final url = _formatImageUrl(video['videoUrl']);

          if (url.contains('youtube.com') || url.contains('youtu.be')) {
            final Uri youtubeUri = Uri.parse(url);
            if (await canLaunchUrl(youtubeUri)) {
              await launchUrl(youtubeUri, mode: LaunchMode.externalApplication);
            }
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder:
                    (context) => LecturePlayerScreen(
                      lecture: {
                        'title': video['title'],
                        'content': url,
                      },
                      courseTitle: video['category'],
                      courseId: '',
                    ),
              ),
            );
          }
        },
        child: Row(
          children: [
            // Play icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.play_circle_filled,
                color: Colors.red,
                size: 28,
              ),
            ),

            const SizedBox(width: 12),

            // Video info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    video['title'],
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.video_library,
                        size: 14,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        video['duration'],
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      const Spacer(),
                      Text(
                        video['views'],
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
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
