import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:shimmer/shimmer.dart';

class CustomCachedImage extends StatefulWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Widget? errorWidget;

  const CustomCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
  });

  @override
  State<CustomCachedImage> createState() => _CustomCachedImageState();
}

class _CustomCachedImageState extends State<CustomCachedImage> {
  File? _imageFile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initImage();
  }

  @override
  void didUpdateWidget(CustomCachedImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageUrl != widget.imageUrl) {
      _initImage();
    }
  }

  String _generateFileName(String url) {
    return md5.convert(utf8.encode(url)).toString();
  }

  Future<void> _initImage() async {
    if (widget.imageUrl.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final cacheDir = await getTemporaryDirectory();
      final fileName = _generateFileName(widget.imageUrl);
      final file = File('${cacheDir.path}/img_cache_$fileName');

      if (await file.exists()) {
        if (mounted) {
          setState(() {
            _imageFile = file;
            _isLoading = false;
          });
        }
      } else {
        _downloadAndCache(file);
      }
    } catch (e) {

      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _downloadAndCache(File file) async {
    try {
      final response = await http
          .get(Uri.parse(widget.imageUrl))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        await file.writeAsBytes(response.bodyBytes);
        if (mounted) {
          setState(() {
            _imageFile = file;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {

      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content;

    if (_isLoading) {
      content = widget.placeholder ?? _buildDefaultShimmer();
    } else if (_imageFile != null) {
      content = Image.file(
        _imageFile!,
        width: widget.width,
        height: widget.height,
        fit: widget.fit,
        errorBuilder:
            (context, error, stackTrace) =>
                widget.errorWidget ?? _buildErrorIcon(),
      );
    } else {
      content = widget.errorWidget ?? _buildErrorIcon();
    }

    if (widget.borderRadius != null) {
      return ClipRRect(borderRadius: widget.borderRadius!, child: content);
    }

    return content;
  }

  Widget _buildDefaultShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: widget.width ?? double.infinity,
        height: widget.height ?? double.infinity,
        color: Colors.white,
      ),
    );
  }

  Widget _buildErrorIcon() {
    return Container(
      width: widget.width,
      height: widget.height,
      color: Colors.grey[200],
      child: const Icon(Icons.broken_image_outlined, color: Colors.grey),
    );
  }
}
