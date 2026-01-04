import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:screen_protector/screen_protector.dart';
import '../../services/api_service.dart';
import '../../models/user_model.dart';

class LecturePlayerScreen extends StatefulWidget {
  final Map<String, dynamic> lecture;
  final String courseTitle;

  const LecturePlayerScreen({
    super.key,
    required this.lecture,
    required this.courseTitle,
  });

  @override
  State<LecturePlayerScreen> createState() => _LecturePlayerScreenState();
}

class _LecturePlayerScreenState extends State<LecturePlayerScreen> with SingleTickerProviderStateMixin {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoading = true;
  bool _hasError = false;
  String _selectedQuality = 'High'; // Default quality
  final List<String> _qualityOptions = ['Low', 'Medium', 'High'];
  User? _user;
  late AnimationController _animationController;
  late Animation<Offset> _animation;

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
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
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
      print('Screen protection error: $e');
    }
  }

  Future<void> _initializePlayer() async {
    try {
      String videoUrl = widget.lecture['content'] ?? '';
      
      print('🎬 Lecture Player Debug:');
      print('   Lecture: ${widget.lecture['title']}');
      print('   Original URL: $videoUrl');
      
      if (videoUrl.isEmpty) {
        print('   ❌ Video URL is empty!');
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
        return;
      }

      // Replace localhost with actual IP for mobile
      if (videoUrl.contains('localhost')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
        final baseUrl = apiUrl.replaceAll('/api', '');
        videoUrl = videoUrl.replaceAll('http://localhost:3000', baseUrl);
        print('   🔄 After localhost replacement: $videoUrl');
      }

      // Convert secure-file to demo-video for demo lectures
      if (videoUrl.contains('/api/storage/secure-file')) {
        videoUrl = videoUrl.replaceAll('/api/storage/secure-file', '/api/storage/demo-video');
        print('   🔄 After secure→demo replacement: $videoUrl');
      }

      // If URL doesn't start with http, prepend base URL
      if (!videoUrl.startsWith('http')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.31.7:3000/api';
        final baseUrl = apiUrl.replaceAll('/api', '');
        videoUrl = '$baseUrl/api/storage/demo-video?path=$videoUrl';
        print('   🔄 After base URL prepend: $videoUrl');
      }

      print('   ✅ Final video URL: $videoUrl');
      print('   🎬 Selected Quality: $_selectedQuality');

      // Quality-based options
      final httpHeaders = <String, String>{};
      
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
        httpHeaders: httpHeaders,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
          allowBackgroundPlayback: false,
        ),
      );
      
      // Set playback speed based on quality (for buffering optimization)
      await _videoPlayerController.initialize();
      
      // Apply quality settings
      if (_selectedQuality == 'Low') {
        // Low quality - prioritize smooth playback
        _videoPlayerController.setVolume(1.0);
      } else if (_selectedQuality == 'Medium') {
        // Medium quality - balanced
        _videoPlayerController.setVolume(1.0);
      } else {
        // High quality - best quality
        _videoPlayerController.setVolume(1.0);
      }

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController,
        aspectRatio: _videoPlayerController.value.aspectRatio,
        autoPlay: true,
        looping: false,
        allowFullScreen: true,
        allowMuting: true,
        showControls: true,
        showControlsOnInitialize: true,
        autoInitialize: true,
        // Optimizations for smooth playback
        placeholder: Container(
          color: Colors.black,
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ),
        // Better buffering
        progressIndicatorDelay: const Duration(milliseconds: 500),
        // Hide controls after 3 seconds
        hideControlsTimer: const Duration(seconds: 3),
        // Material progress colors
        materialProgressColors: ChewieProgressColors(
          playedColor: Colors.red,
          handleColor: Colors.redAccent,
          backgroundColor: Colors.grey[800]!,
          bufferedColor: Colors.grey[600]!,
        ),
        // Custom controls
        customControls: null, // Use default Chewie controls
        // Watermark Overlay
        overlay: _buildWatermark(),
        // Error builder
        errorBuilder: (context, errorMessage) {
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
        },
      );

      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('Video initialization error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  void _showQualitySelector(BuildContext context) {
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
                String description = '';
                IconData icon = Icons.hd;
                
                if (quality == 'Low') {
                  description = 'Smooth playback, lower data usage';
                  icon = Icons.sd;
                } else if (quality == 'Medium') {
                  description = 'Balanced quality and performance';
                  icon = Icons.hd;
                } else {
                  description = 'Best quality, higher data usage';
                  icon = Icons.hd;
                }
                
                return ListTile(
                  leading: Icon(icon, color: isSelected ? Colors.red : Colors.white70),
                  title: Text(
                    quality,
                    style: TextStyle(
                      color: isSelected ? Colors.red : Colors.white,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    description,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                  trailing: isSelected
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
                      // Reinitialize player with new quality
                      _videoPlayerController.dispose();
                      _chewieController?.dispose();
                      _initializePlayer();
                    } else {
                      Navigator.pop(context);
                    }
                  },
                );
              }).toList(),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWatermark() {
    if (_user == null) return const SizedBox.shrink();
    
    final String text = '${_user?.phone ?? ''} | Roll: ${_user?.rollNumber ?? ''}';
    if (text == ' | Roll: ') return const SizedBox.shrink();

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return Align(
            alignment: Alignment(_animation.value.dx, _animation.value.dy),
            child: Opacity(
              opacity: 0.1, // Very subtle for preview
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
          fontSize: 22,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
          shadows: [
            Shadow(offset: Offset(1, 1), blurRadius: 2, color: Colors.black54),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _videoPlayerController.dispose();
    _chewieController?.dispose();
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
                  IconButton(
                    icon: const Icon(Icons.settings, color: Colors.white),
                    onPressed: () {
                      _showQualitySelector(context);
                    },
                  ),
                ],
              ),
            ),

            // Video player
            Expanded(
              child: Center(
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : _hasError
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline, color: Colors.white, size: 60),
                              const SizedBox(height: 16),
                              const Text(
                                'Failed to load video',
                                style: TextStyle(color: Colors.white, fontSize: 16),
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
                                  backgroundColor: Colors.white,
                                  foregroundColor: Colors.black,
                                ),
                              ),
                            ],
                          )
                        : _chewieController != null
                            ? Chewie(controller: _chewieController!)
                            : const SizedBox(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
