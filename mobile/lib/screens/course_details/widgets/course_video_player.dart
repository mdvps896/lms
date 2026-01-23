import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../utils/constants.dart';
import '../../../services/api_service.dart';
import '../../../models/user_model.dart';

class CourseVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final String? thumbnailUrl;

  const CourseVideoPlayer({
    super.key,
    required this.videoUrl,
    this.thumbnailUrl,
  });

  @override
  State<CourseVideoPlayer> createState() => _CourseVideoPlayerState();
}

class _CourseVideoPlayerState extends State<CourseVideoPlayer>
    with SingleTickerProviderStateMixin {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoading = true;
  bool _isYouTube = false;
  String? _youtubeVideoId;
  User? _user;
  late AnimationController _animationController;
  late Animation<Offset> _animation;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _checkVideoType();

    // Setup moving watermark animation
    _animationController = AnimationController(
      duration: const Duration(seconds: 15),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<Offset>(
      begin: const Offset(-0.8, -0.8),
      end: const Offset(0.8, 0.8),
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  Future<void> _loadUser() async {
    final user = await ApiService().getSavedUser();
    if (mounted) {
      setState(() {
        _user = user;
      });
    }
  }

  void _checkVideoType() {
    // Check if URL is YouTube
    if (widget.videoUrl.contains('youtube.com') ||
        widget.videoUrl.contains('youtu.be')) {
      _isYouTube = true;
      _youtubeVideoId = _extractYouTubeId(widget.videoUrl);
      setState(() => _isLoading = false);
    } else {
      _initializeRegularPlayer();
    }
  }

  String? _extractYouTubeId(String url) {
    // Extract video ID from different YouTube URL formats
    if (url.contains('youtube.com/watch')) {
      final uri = Uri.parse(url);
      return uri.queryParameters['v'];
    } else if (url.contains('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    } else if (url.contains('youtube.com/embed/')) {
      return url.split('embed/')[1].split('?')[0];
    }
    return null;
  }

  String _getYouTubeThumbnail(String videoId) {
    return 'https://img.youtube.com/vi/$videoId/maxresdefault.jpg';
  }

  Future<void> _openYouTubeVideo() async {
    try {
      final Uri url = Uri.parse(widget.videoUrl);

      // Try to launch URL
      final bool canLaunch = await canLaunchUrl(url);

      if (canLaunch) {
        final bool launched = await launchUrl(
          url,
          mode: LaunchMode.externalApplication,
        );

        if (!launched) {
          // If launch failed, copy to clipboard
          await _copyUrlToClipboard();
        }
      } else {
        // Cannot launch, copy to clipboard
        await _copyUrlToClipboard();
      }
    } catch (e) {
      await _copyUrlToClipboard();
    }
  }

  Future<void> _copyUrlToClipboard() async {
    await Clipboard.setData(ClipboardData(text: widget.videoUrl));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'YouTube link copied! Open in browser to watch',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _initializeRegularPlayer() async {
    try {

      final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
      final baseUrl = apiUrl.replaceAll('/api', '');

      // Replace localhost with actual IP for mobile
      String videoUrl = widget.videoUrl;
      if (videoUrl.contains('localhost')) {
        videoUrl = videoUrl.replaceAll('http://localhost:3000', baseUrl);
      }

      // If it's a relative path, prepend base URL
      if (!videoUrl.startsWith('http')) {
        videoUrl = '$baseUrl${videoUrl.startsWith('/') ? '' : '/'}$videoUrl';
      }

      // Use demo-video proxy for better range support (streaming)
      if (videoUrl.contains('/api/storage/secure-file') || videoUrl.contains('/api/storage/file/')) {
        String pathForDemo = '';
        if (videoUrl.contains('?path=')) {
          final uri = Uri.parse(videoUrl);
          pathForDemo = uri.queryParameters['path'] ?? '';
        } else if (videoUrl.contains('/api/storage/file/')) {
          pathForDemo = videoUrl.split('/api/storage/file/').last;
        } else if (videoUrl.contains('/api/storage/secure-file/')) {
          pathForDemo = videoUrl.split('/api/storage/secure-file/').last;
        }

        if (pathForDemo.isNotEmpty) {
           videoUrl = '$baseUrl/api/storage/demo-video?path=${Uri.encodeQueryComponent(pathForDemo)}';
        }
      }

      // Ensure non-ASCII characters (e.g. Hindi filenames) or spaces are encoded
      if (videoUrl.contains(RegExp(r'[^\x00-\x7F]')) || videoUrl.contains(' ')) {
        videoUrl = Uri.encodeFull(videoUrl);
      }

      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
      );
      await _videoPlayerController.initialize();

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController,
        aspectRatio: 16 / 9,
        autoPlay: false,
        looping: false,
        placeholder: Container(
          color: Colors.black,
        ), // Black background instead of thumbnail
        materialProgressColors: ChewieProgressColors(
          playedColor: AppConstants.primaryColor,
          handleColor: AppConstants.primaryColor,
          backgroundColor: Colors.grey,
          bufferedColor: Colors.grey[300]!,
        ),
        overlay: _buildWatermark(),
      );

      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    if (!_isYouTube) {
      _videoPlayerController.dispose();
      _chewieController?.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        height: 200,
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    // YouTube video - show thumbnail with info
    if (_isYouTube && _youtubeVideoId != null) {
      return GestureDetector(
        onTap: _openYouTubeVideo,
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // YouTube thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  _getYouTubeThumbnail(_youtubeVideoId!),
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return widget.thumbnailUrl != null
                        ? Image.network(widget.thumbnailUrl!, fit: BoxFit.cover)
                        : Container(color: Colors.black);
                  },
                ),
              ),
              // Dark overlay
              Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              // YouTube info
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // YouTube logo
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 15,
                            spreadRadius: 3,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 50,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Info text
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(25),
                      ),
                      child: const Column(
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.smart_display,
                                color: Colors.white,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Tap to Watch on YouTube',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Course Preview Video',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Regular video
    if (_chewieController == null) {
      return Container(
        height: 200,
        color: Colors.black,
        child: const Center(
          child: Text(
            'Error loading video',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Chewie(controller: _chewieController!),
      ),
    );
  }

  Widget _buildWatermark() {
    if (_user == null) return const SizedBox.shrink();

    final String text =
        '${_user?.phone ?? ''} | Roll: ${_user?.rollNumber ?? ''}';
    if (text == ' | Roll: ') return const SizedBox.shrink();

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return Align(
            alignment: Alignment(_animation.value.dx, _animation.value.dy),
            child: Opacity(
              opacity: 0.1, // Very subtle
              child: _watermarkText(text, 0),
            ),
          );
        },
      ),
    );
  }

  Widget _watermarkText(String text, double rotation) {
    return Transform.rotate(
      angle: rotation * 3.14159 / 180,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
          shadows: [
            Shadow(offset: Offset(1, 1), blurRadius: 2, color: Colors.black54),
          ],
        ),
      ),
    );
  }
}
