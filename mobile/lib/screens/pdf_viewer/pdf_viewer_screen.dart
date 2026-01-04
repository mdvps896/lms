import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:screen_protector/screen_protector.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../services/api_service.dart';

class PdfViewerScreen extends StatefulWidget {
  final Map<String, dynamic> lecture;
  final String courseTitle;
  final String courseId;

  const PdfViewerScreen({
    super.key,
    required this.lecture,
    required this.courseTitle,
    required this.courseId,
  });

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  bool _isLoading = true;
  bool _hasError = false;
  String? _localFilePath;
  final PdfViewerController _pdfViewerController = PdfViewerController();
  int _currentPage = 1;
  int _totalPages = 0;
  
  // Tracking
  final ApiService _apiService = ApiService();
  String? _sessionId;
  Timer? _trackingTimer;
  DateTime? _startTime;

  @override
  void initState() {
    super.initState();
    _setupScreenProtection();
    _loadPdf();
    _startTracking();
  }

  Future<void> _startTracking() async {
    try {
      if (widget.courseId.isEmpty) return;

      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      if (lectureId == null) return;

      _startTime = DateTime.now();
      
      final result = await _apiService.trackPdfView(
        action: 'start',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        lectureName: widget.lecture['title'],
        pdfName: widget.lecture['title'], // Or extract filename
        pdfUrl: widget.lecture['content'],
      );

      if (result['success'] == true) {
        _sessionId = result['sessionId'];
        print('✅ PDF Session Started: $_sessionId');
        
        // Start heartbeat timer (every 30 seconds)
        _trackingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
          _updateTracking();
        });
      }
    } catch (e) {
      print('❌ Failed to start PDF tracking: $e');
    }
  }

  Future<void> _updateTracking() async {
    if (_sessionId == null) return;
    try {
      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      await _apiService.trackPdfView(
        action: 'update',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        sessionId: _sessionId,
        currentPage: _currentPage,
        totalPages: _totalPages > 0 ? _totalPages : null,
      );
    } catch (e) {
      print('⚠️ Failed to update PDF tracking: $e');
    }
  }

  Future<void> _endTracking() async {
    if (_sessionId == null) return;
    try {
      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      _trackingTimer?.cancel();
      
      await _apiService.trackPdfView(
        action: 'end',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        sessionId: _sessionId,
        currentPage: _currentPage,
        totalPages: _totalPages > 0 ? _totalPages : null,
      );
      print('⏹️ PDF Session Ended');
    } catch (e) {
      print('❌ Failed to end PDF tracking: $e');
    }
  }

  Future<void> _setupScreenProtection() async {
    try {
      // Prevent screenshots and screen recording
      await ScreenProtector.protectDataLeakageOn();
      print('🔒 Screen protection enabled for PDF');
    } catch (e) {
      print('Screen protection error: $e');
    }
  }

  Future<void> _loadPdf() async {
    try {
      String pdfUrl = (widget.lecture['content'] ?? '').toString().trim();
      
      print('📄 PDF Viewer Debug:');
      print('   Lecture: ${widget.lecture['title']}');
      print('   Original URL: $pdfUrl');
      
      if (pdfUrl.isEmpty) {
        print('   ❌ PDF URL is empty!');
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
        return;
      }

      // Normalize any URL that points to local storage to use the secure serving endpoint
      if (pdfUrl.contains('/uploads/')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
        final baseUrl = apiUrl.split('/api')[0];
        
        // Extract the relative path starting from /uploads/
        String relativePath = pdfUrl;
        if (pdfUrl.contains('/uploads/')) {
          relativePath = pdfUrl.substring(pdfUrl.indexOf('/uploads/'));
        }
        
        // Ensure it starts with a /
        if (!relativePath.startsWith('/')) {
          relativePath = '/$relativePath';
        }

        // Build the final optimized URL
        pdfUrl = '$baseUrl/api/storage/demo-video?path=$relativePath';
        print('   🔄 Normalized Local URL: $pdfUrl');
      }
      // Fallback: If it's a localhost link but not /uploads/, still fix the domain
      else if (pdfUrl.contains('localhost')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
        final baseUrl = apiUrl.split('/api')[0];
        pdfUrl = pdfUrl.replaceAll('http://localhost:3000', baseUrl);
        print('   🔄 Domain fixed: $pdfUrl');
      }

      print('   ✅ Final PDF URL: $pdfUrl');

      if (mounted) {
        // 1. Check if we already have this file in local cache
        final dir = await getTemporaryDirectory();
        final String fileName = pdfUrl.contains('path=') 
            ? pdfUrl.split('path=')[1].split('/').last 
            : pdfUrl.split('/').last.split('?').first;
        final file = File('${dir.path}/cache_$fileName');

        if (await file.exists()) {
          print('   ⚡ Cache Hit! Loading local file instantly.');
          setState(() {
            _localFilePath = file.path;
            _isLoading = false;
          });
          return;
        }

        // 2. If not in cache, load via network for instant first-time viewing
        setState(() {
          _localFilePath = pdfUrl; 
          _isLoading = false;
        });
        print('   🚀 First-time load: Network Streaming started.');

        // 3. Background Caching: Save for the next time
        _downloadInBackground(pdfUrl, file.path);
      }
    } catch (e, stack) {
      print('❌ PDF processing error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  // Save the file silently in the background so next time is instant
  Future<void> _downloadInBackground(String url, String savePath) async {
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final file = File(savePath);
        await file.writeAsBytes(response.bodyBytes);
        print('   📥 Background Sync: File cached for instant next-time access.');
      }
    } catch (e) {
      print('   ⚠️ Background sync failed: $e');
    }
  }

  @override
  void dispose() {
    _endTracking();
    ScreenProtector.protectDataLeakageOff();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        backgroundColor: Colors.black87,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.lecture['title'] ?? 'PDF Document',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.courseTitle,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          if (_totalPages > 0)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  '$_currentPage / $_totalPages',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading PDF...', style: TextStyle(fontSize: 16)),
                ],
              ),
            )
          : _hasError
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 60, color: Colors.red),
                      const SizedBox(height: 16),
                      const Text(
                        'Failed to load PDF',
                        style: TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _isLoading = true;
                            _hasError = false;
                          });
                          _loadPdf();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                )
              : _localFilePath != null
                  ? _buildFileViewer(_localFilePath!)
                  : const Center(
                      child: Text('No file available'),
                    ),
    );
  }

  Widget _buildFileViewer(String url) {
    final String urlLower = url.toLowerCase();
    final bool isLocal = !url.startsWith('http');
    
    // Check for Images
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].any((ext) => urlLower.contains(ext))) {
       return Center(
         child: InteractiveViewer(
           minScale: 0.5,
           maxScale: 4.0,
           child: isLocal 
            ? Image.file(File(url)) 
            : Image.network(
                url,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return const Center(child: CircularProgressIndicator());
                },
              ),
         ),
       );
    }
    
    // Check for Text Files (Always fresh download for simplicity or read local if available)
    if (urlLower.contains('.txt')) {
      return FutureBuilder<String>(
        future: isLocal ? File(url).readAsString() : http.read(Uri.parse(url)),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Failed to load text file'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Text(
              snapshot.data ?? '',
              style: const TextStyle(fontSize: 16, fontFamily: 'monospace'),
            ),
          );
        },
      );
    }

    // Default: PDF Viewer
    if (isLocal) {
      return SfPdfViewer.file(
        File(url),
        controller: _pdfViewerController,
        onPageChanged: (PdfPageChangedDetails details) {
          setState(() { _currentPage = details.newPageNumber; });
          _updateTracking(); // Track page change
        },
        onDocumentLoaded: (PdfDocumentLoadedDetails details) {
          setState(() { _totalPages = details.document.pages.count; });
        },
      );
    }

    return SfPdfViewer.network(
      url,
      controller: _pdfViewerController,
      onPageChanged: (PdfPageChangedDetails details) {
        setState(() { _currentPage = details.newPageNumber; });
        _updateTracking(); // Track page change
      },
      onDocumentLoaded: (PdfDocumentLoadedDetails details) {
        setState(() { _totalPages = details.document.pages.count; });
      },
    );
  }
}
