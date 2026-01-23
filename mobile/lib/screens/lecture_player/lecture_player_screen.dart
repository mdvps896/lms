import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:screen_protector/screen_protector.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../services/api_service.dart';
import '../../models/user_model.dart';

class LecturePlayerScreen extends StatefulWidget {
  final Map<String, dynamic> lecture;
  final String courseTitle;
  final String courseId;

  const LecturePlayerScreen({
    super.key,
    required this.lecture,
    required this.courseTitle,
    required this.courseId,
  });

  @override
  State<LecturePlayerScreen> createState() => _LecturePlayerScreenState();
}

class _LecturePlayerScreenState extends State<LecturePlayerScreen>
    with SingleTickerProviderStateMixin {
  // Native Video Player
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;

  // YouTube Player
  YoutubePlayerController? _youtubeController;
  bool _isYoutube = false;

  bool _isLoading = true;
  bool _hasError = false;
  String _selectedQuality = 'High'; // Default quality
  final List<String> _qualityOptions = ['Low', 'Medium', 'High'];
  User? _user;
  late AnimationController _animationController;
  late Animation<Offset> _animation;

  // Session Tracking
  Timer? _trackingTimer;
  String? _activityId;

  @override
  void initState() {
    super.initState();
    _setupScreenProtection();
    _loadUser().then((_) => _initializePlayer());

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

  // --- Tracking Logic ---
  Future<void> _startTracking() async {
    
    if (widget.courseId.isEmpty) {
      return;
    }

    final lectureTitle = widget.lecture['title'] ?? 'Untitled Lecture';
    
    // Start tracking
    final result = await ApiService().trackActivity(
      action: 'start',
      type: 'course_view',
      contentId: widget.courseId,
      title: '$lectureTitle (${widget.courseTitle})',
    );

    if (result['success'] == true && result['activityId'] != null) {
      _activityId = result['activityId'];
      
      // Start heartbeat timer (every 10 seconds)
      _trackingTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
        _updateTracking();
      });
    }
  }

  Future<void> _updateTracking() async {
    if (_activityId == null) return;
    
    // Send update/heartbeat (acting as end with continuous updates)
    // The backend 'end' action creates/updates endTime and recalculates duration.
    await ApiService().trackActivity(
      action: 'end', 
      type: 'course_view',
      contentId: widget.courseId,
      title: widget.lecture['title'] ?? 'Unknown',
      activityId: _activityId,
    );
  }

  Future<void> _stopTracking() async {
    _trackingTimer?.cancel();
    if (_activityId != null) {
      await ApiService().trackActivity(
        action: 'end',
        type: 'course_view',
        contentId: widget.courseId,
        title: widget.lecture['title'] ?? 'Unknown',
        activityId: _activityId,
      );
    }
  }

  Future<void> _loadUser() async {
    final user = await ApiService().getSavedUser();
    if (mounted) {
      setState(() {
        _user = user;
      });
    }
  }

  Future<void> _setupScreenProtection() async {
    try {
      // Prevent screenshots and screen recording for paid content
      await ScreenProtector.protectDataLeakageOn();
    } catch (e) {
    }
  }

  Future<void> _initializePlayer() async {
    // Start tracking immediately
    _startTracking();

    try {
      String videoUrl = widget.lecture['content'] ?? '';


      if (videoUrl.isEmpty) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
        return;
      }

      // 1. YouTube Check
      final String? videoId = YoutubePlayer.convertUrlToId(videoUrl);
      if (videoId != null) {
        setState(() => _isYoutube = true);

        _youtubeController = YoutubePlayerController(
          initialVideoId: videoId,
          flags: const YoutubePlayerFlags(
            autoPlay: true,
            mute: false,
            enableCaption: true,
            forceHD: false, // Let user choose via YouTube UI
          ),
        );
        setState(() => _isLoading = false);
        return;
      }

      // Resets for standard player
      setState(() => _isYoutube = false);

      // 2. Standard Video Player Logic
      final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
      final baseUrl = apiUrl.replaceAll('/api', '');

      // Replace localhost with actual IP for mobile
      if (videoUrl.contains('localhost')) {
        videoUrl = videoUrl.replaceAll('http://localhost:3000', baseUrl);
      }

      // If it's a relative path, prepend base URL
      if (!videoUrl.startsWith('http')) {
        videoUrl = '$baseUrl${videoUrl.startsWith('/') ? '' : '/'}$videoUrl';
      }

      // Check if we should use the demo-video proxy (recommended for range support)
      // This helps with streaming and seeking on mobile players like ExoPlayer
      if (videoUrl.contains('/api/storage/secure-file') || videoUrl.contains('/api/storage/file/')) {
        String pathForDemo = '';
        
        if (videoUrl.contains('?path=')) {
          // Extract path from query parameter if present
          final uri = Uri.parse(videoUrl);
          pathForDemo = uri.queryParameters['path'] ?? '';
        } else if (videoUrl.contains('/api/storage/file/')) {
          // Extract path from route: /api/storage/file/uploads/...
          pathForDemo = videoUrl.split('/api/storage/file/').last;
        } else if (videoUrl.contains('/api/storage/secure-file/')) {
          // Extract path from route: /api/storage/secure-file/uploads/...
          pathForDemo = videoUrl.split('/api/storage/secure-file/').last;
        }
        
        if (pathForDemo.isNotEmpty) {
          // Ensure it starts with uploads/ if it doesn't already (and it's not starting with /)
          // But usually the split above should give the correct relative path.
          videoUrl = '$baseUrl/api/storage/demo-video?path=${Uri.encodeQueryComponent(pathForDemo)}';
        }
      }

      // Final encoding check for non-ASCII characters (Hindi filenames) or spaces
      if (videoUrl.contains(RegExp(r'[^\x00-\x7F]')) || videoUrl.contains(' ')) {
        videoUrl = Uri.encodeFull(videoUrl);
      }


      // Native Video Player Init
      final httpHeaders = <String, String>{};

      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
        httpHeaders: httpHeaders,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
          allowBackgroundPlayback: false,
        ),
      );

      await _videoPlayerController!.initialize();

      // Apply quality settings (Volume logic is placeholder for bitrate switching)
      _videoPlayerController!.setVolume(1.0);

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        autoPlay: true,
        looping: false,
        allowFullScreen: true,
        allowMuting: true,
        showControls: true,
        showControlsOnInitialize: true,
        autoInitialize: true,
        placeholder: Container(
          color: Colors.black,
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
        progressIndicatorDelay: const Duration(milliseconds: 500),
        hideControlsTimer: const Duration(seconds: 3),
        materialProgressColors: ChewieProgressColors(
          playedColor: Colors.red,
          handleColor: Colors.redAccent,
          backgroundColor: Colors.grey[800]!,
          bufferedColor: Colors.grey[600]!,
        ),
        // Overlay Watermark
        overlay: _buildWatermark(),
        errorBuilder: (context, errorMessage) {
          return _buildErrorWidget(errorMessage);
        },
      );

      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildErrorWidget(String errorMessage) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.white, size: 60),
          const SizedBox(height: 16),
          const Text(
            'Error loading video',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            errorMessage,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
              _initializePlayer();
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
    );
  }

  void _showQualitySelector(BuildContext context) {
    if (_isYoutube) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please use YouTube player settings for quality control',
          ),
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black87,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Video Quality',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Choose quality based on your internet speed',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 20),
              ..._qualityOptions.map((quality) {
                final isSelected = quality == _selectedQuality;
                // ... (existing quality UI logic can stay, abbreviated for brevity)
                return ListTile(
                  leading: Icon(
                    Icons.hd,
                    color: isSelected ? Colors.red : Colors.white70,
                  ),
                  title: Text(
                    quality,
                    style: TextStyle(
                      color: isSelected ? Colors.red : Colors.white,
                    ),
                  ),
                  trailing:
                      isSelected
                          ? const Icon(Icons.check_circle, color: Colors.red)
                          : null,
                  onTap: () {
                    if (quality != _selectedQuality) {
                      Navigator.pop(context);
                      setState(() {
                        _selectedQuality = quality;
                        _isLoading = true;
                        _hasError = false;
                      });
                      _videoPlayerController?.dispose();
                      _chewieController?.dispose();
                      _initializePlayer();
                    } else {
                      Navigator.pop(context);
                    }
                  },
                );
              }),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
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
              opacity: 0.2, // Increased visibility slightly
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
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
          shadows: [
            Shadow(offset: Offset(1, 1), blurRadius: 2, color: Colors.black54),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _stopTracking(); // Stop session
    _animationController.dispose();
    _videoPlayerController?.dispose();
    _chewieController?.dispose();
    _youtubeController?.dispose(); // Dispose Youtube controller
    ScreenProtector.protectDataLeakageOff();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: Colors.black87,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.lecture['title'] ?? 'Lecture',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          widget.courseTitle,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (!_isYoutube)
                    IconButton(
                      icon: const Icon(Icons.settings, color: Colors.white),
                      onPressed: () => _showQualitySelector(context),
                    ),
                ],
              ),
            ),

            // Video player
            Expanded(
              child: Center(
                child:
                    _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : _hasError
                        ? _buildErrorWidget('Video load failed')
                        : _isYoutube
                        ? Stack(
                          children: [
                            YoutubePlayer(
                              controller: _youtubeController!,
                              showVideoProgressIndicator: true,
                              progressIndicatorColor: Colors.red,
                              progressColors: const ProgressBarColors(
                                playedColor: Colors.red,
                                handleColor: Colors.redAccent,
                              ),
                            ),
                            // Watermark on top of YouTube
                            Positioned.fill(child: _buildWatermark()),
                          ],
                        )
                        : (_chewieController != null
                            ? Chewie(controller: _chewieController!)
                            : const SizedBox()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
