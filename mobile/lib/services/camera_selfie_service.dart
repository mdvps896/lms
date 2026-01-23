import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:image/image.dart' as img;
import 'package:permission_handler/permission_handler.dart';

class CameraSelfieService {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;

  /// Initialize the camera service
  Future<bool> initialize() async {
    try {
      // Get available cameras
      _cameras = await availableCameras();
      
      if (_cameras == null || _cameras!.isEmpty) {
        debugPrint('No cameras available');
        return false;
      }

      // Find front camera
      CameraDescription? frontCamera;
      for (var camera in _cameras!) {
        if (camera.lensDirection == CameraLensDirection.front) {
          frontCamera = camera;
          break;
        }
      }

      // Fallback to first camera if no front camera found
      frontCamera ??= _cameras!.first;

      // Initialize camera controller
      _controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      _isInitialized = true;
      return true;
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      return false;
    }
  }

  /// Check if camera permission is granted
  Future<bool> checkPermission() async {
    final status = await Permission.camera.status;
    return status.isGranted;
  }

  /// Request camera permission
  Future<bool> requestPermission() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  /// Capture a selfie and return the file
  Future<File?> captureSelfie() async {
    try {
      if (!_isInitialized || _controller == null) {
        final initialized = await initialize();
        if (!initialized) {
          debugPrint('Failed to initialize camera');
          return null;
        }
      }

      // Check permission
      final hasPermission = await checkPermission();
      if (!hasPermission) {
        debugPrint('Camera permission not granted');
        return null;
      }

      // Capture image
      final XFile image = await _controller!.takePicture();
      
      // Compress and save
      final compressedFile = await _compressImage(File(image.path));
      
      return compressedFile;
    } catch (e) {
      debugPrint('Error capturing selfie: $e');
      return null;
    }
  }

  /// Compress image to reduce file size
  Future<File> _compressImage(File file) async {
    try {
      // Read image
      final bytes = await file.readAsBytes();
      img.Image? image = img.decodeImage(bytes);

      if (image == null) return file;

      // Resize if too large (max 800px width)
      if (image.width > 800) {
        image = img.copyResize(image, width: 800);
      }

      // Compress as JPEG with quality 85
      final compressedBytes = img.encodeJpg(image, quality: 85);

      // Save to temporary file
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final compressedFile = File('${tempDir.path}/selfie_$timestamp.jpg');
      await compressedFile.writeAsBytes(compressedBytes);

      // Delete original file
      await file.delete();

      return compressedFile;
    } catch (e) {
      debugPrint('Error compressing image: $e');
      return file;
    }
  }

  /// Get camera controller for preview
  CameraController? get controller => _controller;

  /// Check if camera is initialized
  bool get isInitialized => _isInitialized;

  /// Dispose camera resources
  Future<void> dispose() async {
    await _controller?.dispose();
    _controller = null;
    _isInitialized = false;
  }

  /// Show camera preview dialog and capture selfie
  static Future<File?> showCaptureDialog(BuildContext context) async {
    final service = CameraSelfieService();
    
    // Check permission first
    final hasPermission = await service.checkPermission();
    if (!hasPermission) {
      final granted = await service.requestPermission();
      if (!granted) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Camera permission is required to capture selfie'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return null;
      }
    }

    // Initialize camera
    final initialized = await service.initialize();
    if (!initialized) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to initialize camera'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return null;
    }

    if (!context.mounted) return null;

    // Show camera preview dialog
    File? capturedFile;
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => _CameraPreviewDialog(
        service: service,
        onCapture: (file) {
          capturedFile = file;
        },
      ),
    );

    await service.dispose();
    return capturedFile;
  }
  static Future<bool> isImageDark(File imageFile, {int threshold = 20}) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final image = img.decodeImage(bytes);
      if (image == null) return false;

      // Calculate average brightness
      // Simple luminance calculation: 0.2126*R + 0.7152*G + 0.0722*B
      // Or just average of R, G, B for speed
      double totalBrightness = 0;
      int count = 0;
      
      // Sample pixels to save time (step 10)
      for (int y = 0; y < image.height; y += 10) {
        for (int x = 0; x < image.width; x += 10) {
          final pixel = image.getPixel(x, y);
          final r = pixel.r;
          final g = pixel.g;
          final b = pixel.b;
          
          final brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += brightness;
          count++;
        }
      }

      if (count == 0) return false;
      
      final average = totalBrightness / count;
      debugPrint('📸 Image Brightness: $average (Threshold: $threshold)');
      
      return average < threshold;
    } catch (e) {
      debugPrint('Error calculating brightness: $e');
      return false;
    }
  }
}

/// Camera preview dialog widget
class _CameraPreviewDialog extends StatefulWidget {
  final CameraSelfieService service;
  final Function(File?) onCapture;

  const _CameraPreviewDialog({
    required this.service,
    required this.onCapture,
  });

  @override
  State<_CameraPreviewDialog> createState() => _CameraPreviewDialogState();
}

class _CameraPreviewDialogState extends State<_CameraPreviewDialog> {
  bool _isCapturing = false;

  Future<void> _capture() async {
    setState(() => _isCapturing = true);
    
    final file = await widget.service.captureSelfie();
    widget.onCapture(file);
    
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      insetPadding: const EdgeInsets.all(20),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black87,
              child: Row(
                children: [
                  const Icon(Icons.camera_alt, color: Colors.white),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Capture Selfie',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: _isCapturing
                        ? null
                        : () {
                            widget.onCapture(null);
                            Navigator.of(context).pop();
                          },
                  ),
                ],
              ),
            ),

            // Camera Preview
            Expanded(
              child: widget.service.controller != null &&
                      widget.service.isInitialized
                  ? ClipRect(
                      child: OverflowBox(
                        alignment: Alignment.center,
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: MediaQuery.of(context).size.width,
                            child: CameraPreview(widget.service.controller!),
                          ),
                        ),
                      ),
                    )
                  : const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
            ),

            // Instructions and Capture Button
            Container(
              padding: const EdgeInsets.all(20),
              color: Colors.black87,
              child: Column(
                children: [
                  const Text(
                    'Position your face in the center',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isCapturing ? null : _capture,
                      icon: _isCapturing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.camera),
                      label: Text(_isCapturing ? 'Capturing...' : 'Capture'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        textStyle: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
}
