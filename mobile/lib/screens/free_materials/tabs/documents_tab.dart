import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../widgets/free_materials_skeleton.dart';
import '../../pdf_viewer/pdf_viewer_screen.dart';

import 'package:url_launcher/url_launcher.dart' as url_launcher;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DocumentsTab extends StatefulWidget {
  final String searchQuery;

  const DocumentsTab({super.key, required this.searchQuery});

  @override
  State<DocumentsTab> createState() => _DocumentsTabState();
}

class _DocumentsTabState extends State<DocumentsTab> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _documents = [];
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    _fetchMaterials();
  }

  @override
  void didUpdateWidget(DocumentsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _fetchMaterials();
    }
  }

  Future<void> _fetchMaterials() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    
    try {
      final materials = await _apiService.getFreeMaterials();
      List<Map<String, dynamic>> docs = [];
      
      for (var material in materials) {
        if (material['files'] != null) {
          for (var file in material['files']) {
            final url = file['url'].toString().toLowerCase();
            final type = file['type']?.toString().toLowerCase() ?? '';
            final vidExts = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.3gp', '.flv', '.m4v'];
            final docExts = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.svg', '.csv'];
            
            final isVideo = vidExts.any((ext) => url.endsWith(ext)) || type == 'video';
            final isDoc = docExts.any((ext) => url.endsWith(ext)) || ['pdf', 'file', 'doc', 'txt'].contains(type);
            
            if (isDoc && !isVideo) {
              docs.add({
                'id': material['_id'],
                'title': file['title'] ?? material['title'],
                'type': file['type']?.toString().toUpperCase() ?? 'PDF',
                'size': '${((file['size'] ?? 0) / 1024 / 1024).toStringAsFixed(1)} MB',
                'url': file['url'],
                'category': material['category']?['name'] ?? 'General',
                'createdAt': material['createdAt'],
              });
            }
          }
        }
      }

      // Filter by search query
      if (widget.searchQuery.isNotEmpty) {
        docs = docs.where((doc) => 
          doc['title'].toString().toLowerCase().contains(widget.searchQuery.toLowerCase()) ||
          doc['category'].toString().toLowerCase().contains(widget.searchQuery.toLowerCase())
        ).toList();
      }

      _applySorting(docs);
      
      if (mounted) {
        setState(() {
          _documents = docs;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Fetch Materials Error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applySorting(List<Map<String, dynamic>> docs) {
    if (_sortBy == 'newest') {
      docs.sort((a, b) => b['createdAt'].toString().compareTo(a['createdAt'].toString()));
    } else {
      docs.sort((a, b) => a['createdAt'].toString().compareTo(b['createdAt'].toString()));
    }
  }

  void _changeSorting(String sortBy) {
    setState(() {
      _sortBy = sortBy;
      _applySorting(_documents);
    });
  }

  String _formatImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    final String apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
    final String baseUrl = apiUrl.split('/api')[0];
    return '$baseUrl$url';
  }

  Future<void> _handleExternalFile(Map<String, dynamic> doc) async {
    final String manualUrl = _formatImageUrl(doc['url']);
    final Uri fileUri = Uri.parse(manualUrl);
    try {
      if (await url_launcher.canLaunchUrl(fileUri)) {
        await url_launcher.launchUrl(fileUri, mode: url_launcher.LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open file: ${doc['title']}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error opening file: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const FreeMaterialsSkeleton();
    }

    return RefreshIndicator(
      onRefresh: _fetchMaterials,
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

          // Documents list
          Expanded(
            child: _documents.isEmpty
                ? ListView( // Using ListView for RefreshIndicator to work on empty list
                    children: [
                      Padding(
                        padding: EdgeInsets.only(top: MediaQuery.of(context).size.height * 0.2),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.folder_open, size: 80, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text(
                              'No documents found',
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
                    itemCount: _documents.length,
                    itemBuilder: (context, index) {
                      final doc = _documents[index];
                      return _buildDocumentItem(doc);
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

  Widget _buildDocumentItem(Map<String, dynamic> doc) {
    final bool isPDF = doc['url'].toString().toLowerCase().endsWith('.pdf') || doc['type'] == 'PDF';
    final String urlLower = doc['url'].toString().toLowerCase();
    
    IconData getFileIcon() {
      if (isPDF) return Icons.picture_as_pdf;
      if (urlLower.endsWith('.xls') || urlLower.endsWith('.xlsx') || urlLower.endsWith('.csv')) return Icons.table_chart;
      if (urlLower.endsWith('.doc') || urlLower.endsWith('.docx')) return Icons.description;
      if (urlLower.endsWith('.ppt') || urlLower.endsWith('.pptx')) return Icons.slideshow;
      if (['.png', '.jpg', '.jpeg', '.svg', '.gif'].any((ext) => urlLower.endsWith(ext))) return Icons.image;
      return Icons.insert_drive_file;
    }

    Color getFileColor() {
      if (isPDF) return Colors.red;
      if (urlLower.endsWith('.xls') || urlLower.endsWith('.xlsx')) return Colors.green;
      if (urlLower.endsWith('.doc') || urlLower.endsWith('.docx')) return Colors.blue;
      if (urlLower.endsWith('.ppt') || urlLower.endsWith('.pptx')) return Colors.orange;
      if (['.png', '.jpg', '.jpeg', '.svg', '.gif'].any((ext) => urlLower.endsWith(ext))) return Colors.purple;
      return Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: InkWell(
        onTap: () {
          final String urlLower = doc['url'].toString().toLowerCase();
          final bool isViewable = isPDF || 
                                 ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.txt'].any((ext) => urlLower.contains(ext));

          if (isViewable) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PdfViewerScreen(
                  lecture: {
                    'title': doc['title'],
                    'content': doc['url'],
                  },
                  courseTitle: doc['category'],
                  courseId: '',
                ),
              ),
            );
          } else {
            // Open other complex files (Excel, Word) in external browser/app
            _handleExternalFile(doc);
          }
        },
        child: Row(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: getFileColor().withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                getFileIcon(),
                color: getFileColor(),
                size: 28,
              ),
            ),
            
            const SizedBox(width: 12),
            
            // Title and info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doc['title'],
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
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isPDF 
                              ? Colors.red.withOpacity(0.1) 
                              : Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          doc['type'],
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: isPDF ? Colors.red : Colors.blue,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        doc['category'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                      const Spacer(),
                      Text(
                        doc['size'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(width: 8),
            
            const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }
}
