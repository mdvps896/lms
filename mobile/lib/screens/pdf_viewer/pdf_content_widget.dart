import 'dart:io';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:shimmer/shimmer.dart';

class PdfContentWidget extends StatefulWidget {
  final bool isLoading;
  final bool hasError;
  final double downloadProgress;
  final String? localFilePath;
  final String? pdfUrl;
  final PdfViewerController pdfViewerController;
  final int currentPage;
  final int totalPages;
  final Function(PdfPageChangedDetails)? onPageChanged;
  final Function(PdfDocumentLoadedDetails)? onDocumentLoaded;
  final VoidCallback onRetry;
  final VoidCallback onSidebarOpen;

  const PdfContentWidget({
    super.key,
    required this.isLoading,
    required this.hasError,
    required this.downloadProgress,
    this.localFilePath,
    this.pdfUrl,
    required this.pdfViewerController,
    required this.currentPage,
    required this.totalPages,
    this.onPageChanged,
    this.onDocumentLoaded,
    required this.onRetry,
    required this.onSidebarOpen,
  });

  @override
  State<PdfContentWidget> createState() => _PdfContentWidgetState();
}

class _PdfContentWidgetState extends State<PdfContentWidget> {
  // We can keep the helper methods here or make them part of the build

  Widget _buildSkeletonLoader() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SingleChildScrollView(
        child: Column(
          children: List.generate(4, (index) => 
            Container(
              margin: const EdgeInsets.all(16),
              height: index == 0 ? 120 : 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
            )
          ),
        ),
      ),
    );
  }

  Widget _buildFileViewer(String url) {
    final String urlLower = url.toLowerCase();
    final bool isLocal = !url.startsWith('http');

    // Check for Images
    if ([
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.gif',
    ].any((ext) => urlLower.contains(ext))) {
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

    // Default: PDF Viewer
    // We can reuse the same settings for both local and network
    final settings = {
        'controller': widget.pdfViewerController,
        'pageLayoutMode': PdfPageLayoutMode.continuous,
        'enableDoubleTapZooming': true,
        'canShowScrollHead': false,
        'canShowScrollStatus': false,
        'canShowPaginationDialog': false,
        'onPageChanged': widget.onPageChanged,
        'onDocumentLoaded': widget.onDocumentLoaded,
    };

    if (isLocal) {
      return SfPdfViewer.file(
        File(url),
        controller: settings['controller'] as PdfViewerController,
        pageLayoutMode: settings['pageLayoutMode'] as PdfPageLayoutMode,
        enableDoubleTapZooming: settings['enableDoubleTapZooming'] as bool,
        canShowScrollHead: settings['canShowScrollHead'] as bool,
        canShowScrollStatus: settings['canShowScrollStatus'] as bool,
        canShowPaginationDialog: settings['canShowPaginationDialog'] as bool,
        onPageChanged: settings['onPageChanged'] as dynamic,
        onDocumentLoaded: settings['onDocumentLoaded'] as dynamic,
      );
    }

    return SfPdfViewer.network(
      url,
      controller: settings['controller'] as PdfViewerController,
      pageLayoutMode: settings['pageLayoutMode'] as PdfPageLayoutMode,
      enableDoubleTapZooming: settings['enableDoubleTapZooming'] as bool,
      canShowScrollHead: settings['canShowScrollHead'] as bool,
      canShowScrollStatus: settings['canShowScrollStatus'] as bool,
      canShowPaginationDialog: settings['canShowPaginationDialog'] as bool,
      onPageChanged: settings['onPageChanged'] as dynamic,
      onDocumentLoaded: settings['onDocumentLoaded'] as dynamic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: widget.isLoading
          ? Stack(
              children: [
                // 1. Shimmer Background
                _buildSkeletonLoader(),
                
                // 2. Sleek Top Progress Bar (Left to Right)
                if (widget.downloadProgress > 0 && widget.downloadProgress < 1.0)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Column(
                      children: [
                        LinearProgressIndicator(
                          value: widget.downloadProgress,
                          minHeight: 4,
                          backgroundColor: Colors.blue.withValues(alpha: 0.1),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
                        ),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
                          color: Colors.blue.withValues(alpha: 0.05),
                          child: Text(
                            'Downloading: ${(widget.downloadProgress * 100).toInt()}%',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // 3. Central Spinner (Subtle)
                if (widget.downloadProgress == 0)
                  const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            )
          : widget.hasError
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 60,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Failed to load PDF',
                        style: TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: widget.onRetry,
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
              : widget.localFilePath != null
                  ? _buildFileViewer(widget.localFilePath!)
                  : const Center(child: Text('No file available')),
    );
  }
}
