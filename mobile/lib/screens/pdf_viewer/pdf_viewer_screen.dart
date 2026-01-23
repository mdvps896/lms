import 'dart:async';
import 'package:flutter/material.dart';
import 'package:screen_protector/screen_protector.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:shimmer/shimmer.dart';
import '../../services/api_service.dart';
import '../../services/camera_selfie_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:ui' as java_ui;
import 'package:permission_handler/permission_handler.dart';
import 'package:audioplayers/audioplayers.dart';
import 'pdf_content_widget.dart';

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

class _PdfViewerScreenState extends State<PdfViewerScreen> with WidgetsBindingObserver {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoading = true;
  bool _hasError = false;
  String? _localFilePath;
  final PdfViewerController _pdfViewerController = PdfViewerController();
  int _currentPage = 1;
  int _totalPages = 0;
  double _downloadProgress = 0.0;

  // Tracking
  final ApiService _apiService = ApiService();
  String? _sessionId;
  Timer? _trackingTimer;
  DateTime? _startTime;
  
  // Active Reading Tracking
  DateTime _lastActiveTime = DateTime.now(); // Start as active
  int _activeReadingSeconds = 0;
  Timer? _inactivityCheckTimer;
  bool _isReadingPaused = false; // Start unpaused
  static const int _inactivityTimeoutSeconds = 60;
  
  // Page Duration Tracking (Issue 5)
  final Map<int, int> _pageDurations = {};

  // Selfie Capture
  Timer? _selfieTimer;
  bool _isCapturingSelfie = false;
  bool _initialSelfieCaptured = false;
  
  // Settings
  Map<String, dynamic>? _pdfSelfieSettings;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermissionsAndLoad();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // App is in background or screen is off -> Pause Tracking
      _pauseTracking();
    } else if (state == AppLifecycleState.resumed) {
      // App is back in foreground -> Resume Tracking
      _resumeTracking();
    }
  }

  void _pauseTracking() {
    debugPrint('⏸️ App backgrounded/inactive: Pausing tracking timers.');
    _trackingTimer?.cancel();
    _selfieTimer?.cancel();
  }

  void _resumeTracking() async {
    debugPrint('▶️ App resumed: Restarting tracking timers.');
    
    // Immediate permission check
    var status = await Permission.camera.status;
    if (!status.isGranted) {
        debugPrint('⚠️ Permission lost while backgrounded.');
        _handleMissingPermission();
        return; // Don't start tracking yet
    }

    // Resume heartbeat if we have an active session
    if (_sessionId != null && (_trackingTimer == null || !_trackingTimer!.isActive)) {
       _startHeartbeat();
    }
    // Resume selfie capture if enabled
    if (_pdfSelfieSettings?['enabled'] == true) {
      _startPeriodicSelfieCapture();
    }
  }

  Future<void> _checkPermissionsAndLoad() async {
    // Check Camera Permission
    var cameraStatus = await Permission.camera.status;
    var locationStatus = await Permission.location.status;

    if (!cameraStatus.isGranted || !locationStatus.isGranted) {
      // Request permissions
      Map<Permission, PermissionStatus> statuses = await [
        Permission.camera,
        Permission.location,
      ].request();

      cameraStatus = statuses[Permission.camera]!;
      locationStatus = statuses[Permission.location]!;
    }

    if (cameraStatus.isGranted && locationStatus.isGranted) {
      _setupScreenProtection();
      _fetchSettingsAndStart();
      _loadPdf();
    } else {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Permissions Required'),
            content: const Text(
                'Camera and Location permissions are required to view this document. Please grant them in settings to proceed.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Close screen
                },
                child: const Text('Close'),
              ),
              ElevatedButton(
                onPressed: () async {
                  await openAppSettings();
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('Open Settings'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _fetchSettingsAndStart() async {
    try {
      final settings = await _apiService.getSettings();
      if (settings != null && settings['pdfSelfieSettings'] != null) {
        if (mounted) {
          setState(() {
            _pdfSelfieSettings = settings['pdfSelfieSettings'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching PDF settings: $e');
    }
    _startTracking();
    _startInactivityCheck();
  }

  void _onUserActivity() {
    _lastActiveTime = DateTime.now();
    if (_isReadingPaused) {
      if (mounted) {
        setState(() {
          _isReadingPaused = false;
        });
        
        // Stop warning sound regarding inactivity
        _audioPlayer.stop();

        // Only show "Resumed" if we have actually started accumulating time previously or it's substantial
        if (_activeReadingSeconds > 0) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('▶️ Reading Resumed'),
              duration: Duration(seconds: 1),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    }
  }

  void _startInactivityCheck() {
    _inactivityCheckTimer?.cancel();
    _inactivityCheckTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isReadingPaused) return;

      final now = DateTime.now();
      final difference = now.difference(_lastActiveTime).inSeconds;

      if (difference < _inactivityTimeoutSeconds) {
        // User is active
        _activeReadingSeconds++;
        
        // Track per-page duration
        _pageDurations[_currentPage] = (_pageDurations[_currentPage] ?? 0) + 1;

      } else {
        // User is inactive
        if (!_isReadingPaused) {
          _isReadingPaused = true;
          
          // Play inactivity warning sound (max 3 seconds)
          try {
             _audioPlayer.setReleaseMode(ReleaseMode.stop); // Don't loop
             _audioPlayer.play(AssetSource('sound/warnig.mp3'));
             
             // Auto-stop after 3 seconds
             Future.delayed(const Duration(seconds: 3), () async {
                 await _audioPlayer.stop();
             });
          } catch(e) {
              debugPrint('Error playing inactivity sound: $e');
          }

          if (mounted) {
             ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('⏸️ Reading Paused due to inactivity. Sound playing...'),
                duration: Duration(seconds: 3),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }
    });
  }

  Future<void> _startTracking() async {
    try {
      debugPrint('🚀 PDF Tracking: Starting... Course: ${widget.courseId}, Lecture: ${widget.lecture}');
      if (widget.courseId.isEmpty) {
        debugPrint('❌ PDF Tracking: CourseId is empty!');
        return;
      }

      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      if (lectureId == null) {
        debugPrint('❌ PDF Tracking: LectureId is null!');
        return;
      }

      _startTime = DateTime.now();

      // Get current location
      final location = await _getCurrentLocation();
      debugPrint('📍 Captured Location for tracking: $location');

      final result = await _apiService.trackPdfView(
        action: 'start',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        lectureName: widget.lecture['title'],
        pdfName: widget.lecture['title'], // Or extract filename
        pdfUrl: widget.lecture['content'],
        latitude: location?['latitude'],
        longitude: location?['longitude'],
        locationName: location?['locationName'],
      );

      debugPrint('🚀 PDF Tracking Start Result: $result');

      if (result['success'] == true) {
        _sessionId = result['sessionId'];
        debugPrint('✅ PDF Tracking Started. Session ID: $_sessionId');

        // Start heartbeat timer (every 5 seconds for better resolution)
        _startHeartbeat();

        // Attempt to capture selfie if PDF is already loaded but was waiting for session
        if (!_isLoading) {
          _captureInitialSelfie();
        }
      } else {
        debugPrint('❌ PDF Tracking Start Failed: ${result['message']}');
      }
    } catch (e) {
       debugPrint('❌ PDF Tracking Start Error: $e');
    }
  }

  void _startHeartbeat() {
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _updateTracking();
    });
  }

  Future<void> _updateTracking() async {
    if (_sessionId == null) return;
    try {
      debugPrint('💓 PDF Tracking: Sending Heartbeat. Session: $_sessionId, Active: $_activeReadingSeconds, Page: $_currentPage');
      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      
      final result = await _apiService.trackPdfView(
        action: 'update',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        sessionId: _sessionId,
        currentPage: _currentPage,
        totalPages: _totalPages > 0 ? _totalPages : null,
        activeDuration: _activeReadingSeconds,
        pageDurations: _pageDurations,
      );
      
      if (result['success'] != true) {
         debugPrint('❌ PDF Tracking Heartbeat Failed: ${result['message']}');
      }
    } catch (e) {
        debugPrint('❌ PDF Tracking Heartbeat Error: $e');
    }
  }

  Future<void> _endTracking() async {
    if (_sessionId == null) return;
    try {
      debugPrint('🛑 PDF Tracking: Ending Session $_sessionId. Final Duration: $_activeReadingSeconds');
      final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
      _trackingTimer?.cancel();
      _inactivityCheckTimer?.cancel();

      await _apiService.trackPdfView(
        action: 'end',
        courseId: widget.courseId,
        lectureId: lectureId.toString(),
        sessionId: _sessionId,
        currentPage: _currentPage,
        totalPages: _totalPages > 0 ? _totalPages : null,
        activeDuration: _activeReadingSeconds,
        pageDurations: _pageDurations,
      );
      debugPrint('✅ PDF Tracking Ended');

    } catch (e) {
       debugPrint('❌ PDF Tracking End Error: $e');
    }
  }

  Future<void> _setupScreenProtection() async {
    try {
      // Prevent screenshots and screen recording
      await ScreenProtector.protectDataLeakageOn();

    } catch (e) {

    }
  }

  Future<void> _loadPdf() async {
    try {
      String pdfUrl = (widget.lecture['content'] ?? '').toString().trim();

      if (pdfUrl.isEmpty) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
        return;
      }

      // Normalize any URL that points to local storage to use the secure serving endpoint
      if (pdfUrl.contains('/uploads/')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
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

        // Build the final optimized URL using Uri to handle encoding
        final uri = Uri.parse('$baseUrl/api/storage/demo-video').replace(
          queryParameters: {'path': relativePath}
        );
        pdfUrl = uri.toString();
      }
      // Fallback: If it's a localhost link but not /uploads/, still fix the domain
      else if (pdfUrl.contains('localhost')) {
        final apiUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api';
        final baseUrl = apiUrl.split('/api')[0];
        pdfUrl = pdfUrl.replaceAll('http://localhost:3000', baseUrl);
      }

      if (mounted) {
        // 1. Check if we already have this file in local persistent storage
        final dir = await getApplicationDocumentsDirectory();
        // Create a unique filename based on the URL to avoid collisions
        final String fileName = pdfUrl.hashCode.toString() + ".pdf";
        final file = File('${dir.path}/$fileName');

        if (await file.exists()) {
          setState(() {
            _localFilePath = file.path;
            _isLoading = false;
          });
          return;
        }

        // 2. If not in cache, DOWNLOAD IT (with bytes tracking)
        
        await _downloadAndSave(pdfUrl, file.path);

        if (mounted) {
          setState(() {
            _localFilePath = file.path;
            _isLoading = false;
          });
          
          // Capture initial selfie after PDF loads
          _captureInitialSelfie();
        }
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

  // Download and save file with simple progress
  Future<void> _downloadAndSave(String url, String savePath) async {
    final client = http.Client();
    try {
      final response = await client.send(http.Request('GET', Uri.parse(url)));
      
      if (response.statusCode == 200) {
        final List<int> bytes = [];
        final int? total = response.contentLength;
        int received = 0;

        await response.stream.forEach((List<int> chunk) {
          bytes.addAll(chunk);
          received += chunk.length;
          if (total != null && total > 0) {
            if (mounted) {
              setState(() {
                _downloadProgress = received / total;
              });
            }
          }
        });

        final file = File(savePath);
        await file.writeAsBytes(bytes);
      } else {
        throw Exception('Failed to download PDF: Status ${response.statusCode}');
      }
    } finally {
      client.close();
    }
  }

  final ValueNotifier<int> _currentPageNotifier = ValueNotifier<int>(1);

  // Issue: Permission might be lost during session. Handle this.
  bool _isPermissionDialogShowing = false;
  
  // Audio Player for warnings
  final AudioPlayer _audioPlayer = AudioPlayer();

  Future<void> _handleMissingPermission() async {
    if (_isPermissionDialogShowing) return;
    _isPermissionDialogShowing = true;
    
    // Pause reading while we handle this
    _isReadingPaused = true; 

    // Play warning sound (max 3 seconds)
    try {
        await _audioPlayer.setReleaseMode(ReleaseMode.stop); // Don't loop
        await _audioPlayer.play(AssetSource('sound/warnig.mp3'));
        
        // Auto-stop after 3 seconds
        Future.delayed(const Duration(seconds: 3), () async {
           // check if still playing/relevant? 
           // If user already cancelled/fixed, player might be stopped.
           // Calling stop is safe.
           await _audioPlayer.stop();
        });
    } catch(e) {
        debugPrint('Error playing warning sound: $e');
    }

    if (mounted) {
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Camera Permission Required'),
          content: const Text(
              'Camera access is required to verify attendance. Please enable camera permissions in settings to continue.'),
          actions: [
            TextButton(
              onPressed: () async {
                 await _audioPlayer.stop(); // Stop sound
                 Navigator.pop(context); // Close dialog
                 if (mounted && Navigator.canPop(context)) {
                    Navigator.pop(context); // Close Screen (Go back)
                 }
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                await _audioPlayer.stop(); // Stop sound
                await openAppSettings();
                Navigator.pop(context);
              },
              child: const Text('Open Settings'),
            ),
          ],
        ),
      );
      _isPermissionDialogShowing = false;
      await _audioPlayer.stop(); // Ensure sound stops
      
      // Re-check after dialog closes
      var status = await Permission.camera.status;
      if (status.isGranted) {
          // Resume if granted
          if (mounted) {
              setState(() {
                  _isReadingPaused = false;
                  _onUserActivity(); // Reset active timer
              });
          }
      }
    } else {
        _isPermissionDialogShowing = false;
    }
  }

  // Selfie Capture Methods
  Future<void> _captureInitialSelfie() async {
    if (_initialSelfieCaptured || _sessionId == null) return;
    
    try {
      // Direct permission check
      var status = await Permission.camera.status;
      if (!status.isGranted) {
          debugPrint('Camera permission lost for initial capture');
          await _handleMissingPermission();
          status = await Permission.camera.status;
           if (!status.isGranted) return; // Still not granted
      }

      final service = CameraSelfieService();
      // ... (rest of service usage, skip double check inside service if we want, or double check is fine) ...
      // service.checkPermission() inside captureSelfie will pass now if granted.

      await service.initialize();
      final selfieFile = await service.captureSelfie();
      
      // Increase delay before disposal to avoid "Handler on a dead thread" errors
      await Future.delayed(const Duration(milliseconds: 800));
      await service.dispose();

      // Check if selfies are enabled in settings (Issue 2)
      bool selfieEnabled = _pdfSelfieSettings?['enabled'] ?? false; // Default to false if null
      bool captureOnStart = _pdfSelfieSettings?['captureOnStart'] ?? false;
      
      if (!selfieEnabled) {
        debugPrint('🚫 Selfie capture disabled in settings.');
        return;
      }

      if (selfieFile != null && mounted) {
        // Validation: Check if image is black/dark
        bool isDark = await CameraSelfieService.isImageDark(selfieFile);
        if (isDark) {
             debugPrint('⚠️ Selfie rejected: Too dark/black.');
             
             if (mounted) {
                 setState(() {
                    _isReadingPaused = true; // Trigger Blur
                 });

                 // Play Sound
                 try {
                    await _audioPlayer.setReleaseMode(ReleaseMode.stop);
                    await _audioPlayer.play(AssetSource('sound/warnig.mp3'));
                    // Auto-stop after 3 seconds
                    Future.delayed(const Duration(seconds: 3), () async {
                        await _audioPlayer.stop();
                    });
                 } catch(e) {}

                 await showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => AlertDialog(
                        title: const Text("Camera Blocked"),
                        content: const Text("Your camera appears to be covered or too dark. Please uncover it to continue reading."),
                        actions: [
                            TextButton(onPressed: () {
                                Navigator.pop(context); // Close dialog
                                if (Navigator.canPop(context)) {
                                    Navigator.pop(context); // Close PDF Screen
                                }
                            }, child: const Text("Close PDF")),
                             ElevatedButton(onPressed: () {
                                Navigator.pop(context);
                                if (mounted) {
                                    setState(() { _isReadingPaused = false; });
                                    _onUserActivity(); 
                                }
                             }, child: const Text("Try Again")),
                        ]
                    )
                 );
             }
             return; // Do NOT upload
        }

        if (selfieEnabled && captureOnStart) {
          _initialSelfieCaptured = true;
          
          // Upload selfie
          final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
          final location = await _getCurrentLocation();
          await _apiService.uploadPdfSelfie(
            selfieFile: selfieFile,
            sessionId: _sessionId!,
            courseId: widget.courseId,
            lectureId: lectureId.toString(),
            currentPage: _currentPage,
            isInitial: true,
            latitude: location?['latitude'],
            longitude: location?['longitude'],
            locationName: location?['locationName'],
          );
          
          // Show subtle indicator
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Attendance verified'),
                duration: Duration(seconds: 2),
                backgroundColor: Colors.green,
              ),
            );
          }
        }

        // Always start the periodic timer if enabled, even if initial wasn't uploaded
        if (selfieEnabled) {
          _startPeriodicSelfieCapture();
        }
      }
    } catch (e) {
      debugPrint('Error capturing initial selfie: $e');
    }
  }

  void _startPeriodicSelfieCapture() {
    _selfieTimer?.cancel();
    int intervalMinutes = _pdfSelfieSettings?['intervalInMinutes'] ?? 5;
    
    _selfieTimer = Timer.periodic(Duration(minutes: intervalMinutes), (timer) {
      _capturePeriodicSelfie();
    });
  }

  Future<void> _capturePeriodicSelfie() async {
    if (_isCapturingSelfie || _sessionId == null) return;
    
    // Double check settings before capture (Issue 2)
    bool selfieEnabled = _pdfSelfieSettings?['enabled'] ?? false;
    if (!selfieEnabled) {
       _selfieTimer?.cancel();
       return;
    }
    
    // Don't capture if screen is dark/app inactive (extra safety) or reading paused
    if (_isReadingPaused) return;

    // Check permission BEFORE capturing
    var status = await Permission.camera.status;
    if (!status.isGranted) {
        debugPrint('Camera permission lost during periodic capture');
        await _handleMissingPermission();
        return; // Skip this cycle, will try again next timer tick
    }
    
    setState(() => _isCapturingSelfie = true);
    
    try {
      final service = CameraSelfieService();
      await service.initialize();
      final selfieFile = await service.captureSelfie();
      
      // Increase delay before disposal to avoid internal camera race conditions
      await Future.delayed(const Duration(seconds: 1));
      await service.dispose();

      if (selfieFile != null && mounted) {
        // Validation: Check if image is black/dark
        bool isDark = await CameraSelfieService.isImageDark(selfieFile);
        if (isDark) {
             debugPrint('⚠️ Selfie rejected: Too dark/black.');
             
             if (mounted) {
                 setState(() {
                    _isReadingPaused = true; // Trigger Blur
                 });

                 // Play Sound
                 try {
                    await _audioPlayer.setReleaseMode(ReleaseMode.stop);
                    await _audioPlayer.play(AssetSource('sound/warnig.mp3'));
                    // Auto-stop after 3 seconds
                    Future.delayed(const Duration(seconds: 3), () async {
                        await _audioPlayer.stop();
                    });
                 } catch(e) {}
                 
                 await showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => AlertDialog(
                        title: const Text("Camera Blocked"),
                        content: const Text("Your camera appears to be covered or too dark. Please uncover it to continue reading."),
                        actions: [
                            TextButton(onPressed: () {
                                Navigator.pop(context); // Close dialog
                                if (Navigator.canPop(context)) {
                                    Navigator.pop(context); // Close PDF Screen
                                }
                            }, child: const Text("Close PDF")),
                             ElevatedButton(onPressed: () {
                                Navigator.pop(context);
                                if (mounted) {
                                    setState(() { _isReadingPaused = false; });
                                    _onUserActivity(); 
                                }
                             }, child: const Text("Try Again")),
                        ]
                    )
                 );
             }
             return; 
        }

        final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
        final location = await _getCurrentLocation();
        await _apiService.uploadPdfSelfie(
          selfieFile: selfieFile,
          sessionId: _sessionId!,
          courseId: widget.courseId,
          lectureId: lectureId.toString(),
          currentPage: _currentPage,
          isInitial: false,
          latitude: location?['latitude'],
          longitude: location?['longitude'],
          locationName: location?['locationName'],
        );
      }
    } catch (e) {
      debugPrint('Error capturing periodic selfie: $e');
    } finally {
      if (mounted) {
        setState(() => _isCapturingSelfie = false);
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _currentPageNotifier.dispose();
    _selfieTimer?.cancel();
    
    // Capture final selfie if enabled
    if (_pdfSelfieSettings?['enabled'] == true && _pdfSelfieSettings?['captureOnEnd'] == true) {
       _captureExitSelfie();
    }
    
    _endTracking();
    ScreenProtector.protectDataLeakageOff();
    super.dispose();
  }

  Future<void> _captureExitSelfie() async {
    if (_sessionId == null) return;
    try {
      final service = CameraSelfieService();
      await service.initialize();
      final selfieFile = await service.captureSelfie();
      
      // Increase delay before disposal to avoid internal camera race conditions
      await Future.delayed(const Duration(seconds: 1));
      await service.dispose();

      if (selfieFile != null) {
        final lectureId = widget.lecture['_id'] ?? widget.lecture['id'];
        final location = await _getCurrentLocation();
        await _apiService.uploadPdfSelfie(
          selfieFile: selfieFile,
          sessionId: _sessionId!,
          courseId: widget.courseId,
          lectureId: lectureId.toString(),
          currentPage: _currentPage,
          isInitial: false, // Or define a new type for exit
          latitude: location?['latitude'],
          longitude: location?['longitude'],
          locationName: location?['locationName'],
        );
      }
    } catch (e) {
      debugPrint('Error capturing exit selfie: $e');
    }
  }

  Future<Map<String, dynamic>?> _getCurrentLocation() async {
    debugPrint('📍 Fetching current location...');
    try {
      // Issue 8: Check settings before accessing location
      bool locationEnabled = _pdfSelfieSettings?['locationEnabled'] ?? true;
      if (!locationEnabled) {
         debugPrint('🚫 Location disabled in PDF settings.');
         return null;
      }

      bool serviceEnabled;
      LocationPermission permission;

      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('📍 Location services are disabled.');
        final lastPos = await Geolocator.getLastKnownPosition();
        if (lastPos != null) {
          final address = await _getAddressFromLatLng(lastPos.latitude, lastPos.longitude);
          return {
            'latitude': lastPos.latitude,
            'longitude': lastPos.longitude,
            'locationName': address,
          };
        }
        return null;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('📍 Location permissions were denied');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint('📍 Location permissions are permanently denied');
        return null;
      }

      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 10),
        );
        final address = await _getAddressFromLatLng(position.latitude, position.longitude);
        return {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'locationName': address,
        };
      } catch (e) {
        debugPrint('📍 Failed to get precise position ($e), checking last known...');
        final lastPos = await Geolocator.getLastKnownPosition();
        if (lastPos != null) {
          final address = await _getAddressFromLatLng(lastPos.latitude, lastPos.longitude);
          return {
            'latitude': lastPos.latitude,
            'longitude': lastPos.longitude,
            'locationName': address,
          };
        }
        return null;
      }
    } catch (e) {
      debugPrint('📍 Error in _getCurrentLocation: $e');
      return null;
    }
  }

  Future<String?> _getAddressFromLatLng(double lat, double lng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        // Example: "Pune, Maharashtra, India"
        final parts = [
          if (place.locality != null && place.locality!.isNotEmpty) place.locality,
          if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) place.administrativeArea,
          if (place.country != null && place.country!.isNotEmpty) place.country,
        ];
        return parts.join(', ');
      }
    } catch (e) {
      debugPrint('Error getting address: $e');
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
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
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              widget.courseTitle,
              style: const TextStyle(color: Colors.white70, fontSize: 11),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: _currentPageNotifier,
            builder: (context, page, child) {
              if (_totalPages <= 0) return const SizedBox.shrink();
              return Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$page / $_totalPages',
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.grid_view_rounded, color: Colors.white),
            tooltip: 'Show Pages',
            onPressed: () {
              if (_totalPages > 0) {
                _scaffoldKey.currentState?.openEndDrawer();
              }
            },
          ),
        ],
      ),
      // Show selfie indicator when capturing
      floatingActionButton: _isCapturingSelfie
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Verifying attendance...',
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            )
          : null,
      endDrawer: _buildSidebar(),
      body: Listener(
        onPointerDown: (_) => _onUserActivity(),
        onPointerMove: (_) => _onUserActivity(),
        behavior: HitTestBehavior.translucent,
        child: ImageFiltered(
          imageFilter: _isReadingPaused
              ? java_ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10)
              : java_ui.ImageFilter.blur(sigmaX: 0, sigmaY: 0),
          child: PdfContentWidget(
            isLoading: _isLoading,
            hasError: _hasError,
            downloadProgress: _downloadProgress,
            localFilePath: _localFilePath,
            pdfUrl: null, // Logic handles local file preference
            pdfViewerController: _pdfViewerController,
            currentPage: _currentPage,
            totalPages: _totalPages,
            onPageChanged: (PdfPageChangedDetails details) {
              _currentPageNotifier.value = details.newPageNumber;
              _currentPage = details.newPageNumber;
              _updateTracking(); // Track page change
              _onUserActivity(); // Reset inactivity timer
            },
            onDocumentLoaded: (PdfDocumentLoadedDetails details) {
              setState(() {
                _totalPages = details.document.pages.count;
              });
            },
            onRetry: () {
               setState(() {
                  _isLoading = true;
                  _hasError = false;
                  _downloadProgress = 0;
                });
                _loadPdf();
            },
            onSidebarOpen: () {
               _scaffoldKey.currentState?.openEndDrawer();
            }
          ),
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return Drawer(
      width: 280,
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(top: 50, left: 20, right: 20, bottom: 20),
            color: Colors.black,
            width: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Quick Navigation',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Total Pages: $_totalPages',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          Expanded(
            child: _totalPages > 0
                ? ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    itemCount: _totalPages,
                    separatorBuilder: (context, index) => const Divider(height: 1, indent: 20, endIndent: 20),
                    itemBuilder: (context, index) {
                      final pageNum = index + 1;
                      final isCurrent = pageNum == _currentPage;
                      return ListTile(
                        leading: Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: isCurrent ? Colors.blue : Colors.grey[200],
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '$pageNum',
                              style: TextStyle(
                                color: isCurrent ? Colors.white : Colors.black87,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        title: Text(
                          'Page $pageNum',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                            color: isCurrent ? Colors.blue : Colors.black87,
                          ),
                        ),
                        trailing: isCurrent ? const Icon(Icons.check_circle, color: Colors.blue, size: 18) : null,
                        onTap: () {
                          _pdfViewerController.jumpToPage(pageNum);
                          Navigator.pop(context); // Close drawer
                        },
                      );
                    },
                  )
                : const Center(
                    child: Text('No pages available'),
                  ),
          ),
        ],
      ),
    );
  }






}
