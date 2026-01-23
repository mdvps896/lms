import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import '../services/api_service.dart';
import '../widgets/search_skeleton.dart';
import '../widgets/search_filter_bottom_sheet.dart';
import 'course_details/course_details_screen.dart';
import 'pdf_viewer/pdf_viewer_screen.dart';
import 'package:url_launcher/url_launcher.dart' as url_launcher;
import '../widgets/common/custom_cached_image.dart';
import 'lecture_player/lecture_player_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final ApiService _apiService = ApiService();

  // Data Sources
  List<Map<String, dynamic>> _allData = []; // Combined list
  List<Map<String, dynamic>> _searchResults = [];
  List<Map<String, dynamic>> _suggestions = [];
  List<String> _recentSearches = [];

  bool _isSearching = false;
  bool _showResults = false;
  bool _isLoadingData = true;
  Timer? _debounce;

  // Filter states
  String _selectedFilter = 'all'; // all, courses, pdfs, meetings, free
  String _selectedSort = 'newest';

  @override
  void initState() {
    super.initState();
    _searchFocusNode.requestFocus();
    _loadRecentSearches();
    _fetchAllData();
  }

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _recentSearches = prefs.getStringList('recent_searches') ?? [];
    });
  }

  Future<void> _saveRecentSearch(String query) async {
    if (query.trim().isEmpty) return;
    if (!_recentSearches.contains(query)) {
      final prefs = await SharedPreferences.getInstance();
      final updated = [query, ..._recentSearches].take(5).toList();
      await prefs.setStringList('recent_searches', updated);
      setState(() {
        _recentSearches = updated;
      });
    }
  }

  Future<void> _fetchAllData() async {
    try {
      // Fetch all concurrently for speed
      final results = await Future.wait([
        _apiService.getCourses(),
        _apiService.getFreeMaterials(),
        _apiService.getMeetings(),
      ]);

      final courses = results[0].map((c) => {...c, 'type': 'course'}).toList();

      // Process free materials - expand files array into individual searchable items
      List<Map<String, dynamic>> expandedMaterials = [];
      for (var m in results[1]) {
        String categoryName = 'Material';
        if (m['category'] is Map) {
          categoryName = m['category']['name']?.toString() ?? 'Material';
        } else if (m['category'] != null) {
          categoryName = m['category'].toString();
        }

        // If material has files array, create separate entries for each file
        if (m['files'] != null &&
            m['files'] is List &&
            (m['files'] as List).isNotEmpty) {
          for (var file in m['files']) {
            if (file is Map) {
              String fileType =
                  (file['type'] ?? 'file').toString().toLowerCase();
              // Normalize type
              if (fileType == 'video') {
                fileType = 'video';
              } else if (fileType == 'pdf' || fileType == 'doc') {
                fileType = 'pdf';
              } else {
                fileType = 'pdf'; // default to pdf for documents
              }

              expandedMaterials.add({
                '_id': m['_id'],
                'title': file['title'] ?? m['title'] ?? 'Untitled',
                'materialTitle': m['title'], // Keep parent title for reference
                'url': file['url'],
                'fileUrl': file['url'],
                'path': file['url'],
                'type': fileType,
                'category': categoryName,
                'rating': 4.5,
                'size': file['size'],
              });
            }
          }
        } else {
          // No files array, keep as is
          expandedMaterials.add({
            ...m,
            'type': m['type'] == 'video' ? 'video' : 'pdf',
            'category': categoryName,
            'rating': 4.5,
          });
        }
      }

      final meetings =
          results[2].map((m) {
            String categoryName = 'Meeting';
            if (m['category'] is Map) {
              categoryName = m['category']['name']?.toString() ?? 'Meeting';
            } else if (m['category'] != null) {
              categoryName = m['category'].toString();
            }

            return {
              ...m,
              'type': 'meeting',
              'title': m['title'] ?? 'Live Class',
              'category': categoryName,
              'rating': 5.0,
            };
          }).toList();

      if (mounted) {
        setState(() {
          _allData = [...courses, ...expandedMaterials, ...meetings];
          // Set suggestions to top rated courses initially
          _suggestions = courses.take(5).toList();
          _isLoadingData = false;
        });
      }
    } catch (e) {

      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();

    if (query.isEmpty) {
      setState(() {
        _showResults = false;
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _showResults = true;
    });

    // Debounce search for 300ms (faster feeling)
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _performSearch(query);
    });
  }

  void _performSearch(String query) {
    _saveRecentSearch(query);

    // Filter local data
    var results =
        _allData.where((item) {
          final title = (item['title'] ?? '').toString().toLowerCase();
          final category = (item['category'] ?? '').toString().toLowerCase();
          // Only courses have instructors mainly
          final instructor =
              (item['instructor'] ?? '').toString().toLowerCase();
          final searchLower = query.toLowerCase();

          return title.contains(searchLower) ||
              category.contains(searchLower) ||
              instructor.contains(searchLower);
        }).toList();

    // Apply content type filter
    results = _applyContentFilter(results);

    // Apply sorting
    results = _applySorting(results);

    if (mounted) {
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    }
  }

  List<Map<String, dynamic>> _applyContentFilter(
    List<Map<String, dynamic>> results,
  ) {
    if (_selectedFilter == 'all') return results;

    switch (_selectedFilter.toLowerCase()) {
      case 'courses':
        return results.where((item) => item['type'] == 'course').toList();
      case 'pdfs':
        return results.where((item) => item['type'] == 'pdf').toList();
      case 'meetings':
        return results.where((item) => item['type'] == 'meeting').toList();
      case 'free':
        return results.where((item) {
          final price = item['price'].toString();
          return price == '0' || price.toLowerCase() == 'free';
        }).toList();
      default:
        return results;
    }
  }

  List<Map<String, dynamic>> _applySorting(List<Map<String, dynamic>> results) {
    if (_selectedSort == 'newest') {
      // Sort by creation date if available, or just keeping order
      // Assuming 'id' is MongoID which is time-sorted
      results.sort(
        (a, b) => (b['_id'] ?? b['id'] ?? '').toString().compareTo(
          (a['_id'] ?? a['id'] ?? '').toString(),
        ),
      );
    } else if (_selectedSort == 'highest_rated') {
      results.sort((a, b) {
        double rA = double.tryParse((a['rating'] ?? 0).toString()) ?? 0;
        double rB = double.tryParse((b['rating'] ?? 0).toString()) ?? 0;
        return rB.compareTo(rA);
      });
    } else if (_selectedSort == 'lowest_price') {
      results.sort((a, b) {
        double pA = double.tryParse((a['price'] ?? 0).toString()) ?? 0;
        double pB = double.tryParse((b['price'] ?? 0).toString()) ?? 0;
        return pA.compareTo(pB);
      });
    }
    return results;
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => SearchFilterBottomSheet(
            selectedFilter: _selectedFilter,
            selectedSort: _selectedSort,
            onApply: (filter, sort) {
              setState(() {
                _selectedFilter = filter;
                _selectedSort = sort;
              });
              // Re-run search with new filters
              if (_searchController.text.isNotEmpty) {
                _performSearch(_searchController.text);
              }
            },
          ),
    );
  }

  void _onSuggestionTap(Map<String, dynamic> course) {
    _searchController.text = course['title'];
    _performSearch(course['title']);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppConstants.textPrimary),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Container(
          height: 45,
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(25),
          ),
          child: TextField(
            controller: _searchController,
            focusNode: _searchFocusNode,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search courses, categories...',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              prefixIcon: const Icon(
                Icons.search,
                color: AppConstants.primaryColor,
                size: 20,
              ),
              suffixIcon:
                  _searchController.text.isNotEmpty
                      ? IconButton(
                        icon: const Icon(
                          Icons.clear,
                          color: Colors.grey,
                          size: 20,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                      : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppConstants.accentColor.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.tune_rounded,
                color: AppConstants.primaryColor,
                size: 20,
              ),
            ),
            onPressed: () {
              _showFilterBottomSheet();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isSearching) {
      return const SearchSkeleton();
    }

    if (_showResults) {
      return _buildSearchResults();
    }

    return _buildSuggestions();
  }

  Widget _buildSuggestions() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Popular Courses',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _suggestions.length,
            itemBuilder: (context, index) {
              final course = _suggestions[index];
              return _buildSuggestionItem(course);
            },
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Recent Searches',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child:
                _recentSearches.isEmpty
                    ? const Text(
                      'No recent searches',
                      style: TextStyle(color: Colors.grey),
                    )
                    : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children:
                          _recentSearches
                              .map((text) => _buildRecentChip(text))
                              .toList(),
                    ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSuggestionItem(Map<String, dynamic> course) {
    return InkWell(
      onTap: () => _handleNavigation(course),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppConstants.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.school_outlined,
                color: AppConstants.primaryColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course['title'],
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    course['category'],
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.north_west, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentChip(String text) {
    return InkWell(
      onTap: () {
        _searchController.text = text;
        _onSearchChanged(text);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.history, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 6),
            Text(text, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try searching with different keywords',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(
            '${_searchResults.length} results found',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final course = _searchResults[index];
              return _buildCourseCard(course);
            },
          ),
        ),
      ],
    );
  }

  void _handleNavigation(Map<String, dynamic> item) async {
    if (item['type'] == 'course') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CourseDetailsScreen(course: item),
        ),
      );
    } else if (item['type'] == 'pdf') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => PdfViewerScreen(
                lecture: {
                  'title': item['title'],
                  'content': _apiService.getFullUrl(item['url'] ?? item['fileUrl'] ?? item['path']),
                },
                courseTitle: 'Search Result',
                courseId: '',
              ),
        ),
      );
    } else if (item['type'] == 'video') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => LecturePlayerScreen(
                lecture: {
                  'title': item['title'],
                  'content': _apiService.getFullUrl(
                    item['url'] ?? item['fileUrl'] ?? item['path'],
                  ),
                },
                courseTitle: item['category'] ?? 'Search Result',
                courseId: '',
              ),
        ),
      );
    } else if (item['type'] == 'meeting') {
      String? url = item['meetingLink'] ?? item['link'];
      
      // Check links array if main link is missing
      if ((url == null || url.isEmpty) && item['links'] != null && (item['links'] as List).isNotEmpty) {
        final links = item['links'] as List;
        if (links.first is Map) {
          url = links.first['url'];
        }
      }
      
      if (url == null || url.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No meeting link available'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      try {
        final uri = Uri.parse(url);

        // Use platformDefault to let user choose browser
        if (await url_launcher.canLaunchUrl(uri)) {
          await url_launcher.launchUrl(
            uri,
            mode: url_launcher.LaunchMode.platformDefault,
          );
        } else {
          try {
             // Fallback for some devices/browsers
             await url_launcher.launchUrl(
               uri,
               mode: url_launcher.LaunchMode.externalApplication,
             );
          } catch (e) {
             throw 'Could not launch meeting link';
          }
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
      }
    }
  }

  Widget _buildCourseCard(Map<String, dynamic> item) {
    return InkWell(
      onTap: () => _handleNavigation(item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
              child: _buildThumbnail(item),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppConstants.accentColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item['category'] ?? 'General',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppConstants.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item['title'] ?? 'Untitled',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    if (item['type'] == 'course')
                      Row(
                        children: [
                          Icon(
                            Icons.person_outline,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item['instructor'] ?? 'Admin',
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
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (item['rating'] != null) ...[
                          const Icon(Icons.star, size: 14, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text(
                            item['rating'].toString(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (item['type'] == 'course') ...[
                          Icon(
                            Icons.people_outline,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${item['students'] ?? 0}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                        if (item['type'] == 'pdf')
                          const Text(
                            'PDF Document',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        if (item['type'] == 'meeting')
                          const Text(
                            'Live Session',
                            style: TextStyle(fontSize: 12, color: Colors.red),
                          ),
                        if (item['type'] == 'video')
                          const Text(
                            'Video Lecture',
                            style: TextStyle(fontSize: 12, color: Colors.blue),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThumbnail(Map<String, dynamic> item) {
    if (item['type'] == 'course' && item['thumbnail'] != null) {
      return CustomCachedImage(
        imageUrl: item['thumbnail'],
        width: 100,
        height: 120,
        fit: BoxFit.cover,
      );
    } else if (item['type'] == 'pdf') {
      return Container(
        width: 100,
        height: 120,
        color: Colors.red[50],
        child: const Center(
          child: Icon(Icons.picture_as_pdf, color: Colors.red, size: 40),
        ),
      );
    } else if (item['type'] == 'video') {
      return Container(
        width: 100,
        height: 120,
        color: Colors.blue[50],
        child: const Center(
          child: Icon(Icons.play_circle_filled, color: Colors.blue, size: 40),
        ),
      );
    } else if (item['type'] == 'meeting') {
      return Container(
        width: 100,
        height: 120,
        color: Colors.blue[50],
        child: const Center(
          child: Icon(Icons.video_call, color: Colors.blue, size: 40),
        ),
      );
    }
    return Container(width: 100, height: 120, color: Colors.grey[200]);
  }
}
