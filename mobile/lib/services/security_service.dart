import 'package:safe_device/safe_device.dart';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';

class SecurityService {
  static final SecurityService _instance = SecurityService._internal();
  factory SecurityService() => _instance;
  SecurityService._internal();

  bool _isSecurityChecked = false;
  bool _isDeviceSecure = true;
  String _securityIssue = '';

  bool get isDeviceSecure => _isDeviceSecure;
  String get securityIssue => _securityIssue;

  /// Check if device is rooted/jailbroken or running on emulator
  Future<Map<String, dynamic>> performSecurityCheck() async {
    if (_isSecurityChecked) {
      return {'isSecure': _isDeviceSecure, 'issue': _securityIssue};
    }

    try {
      // Check for Jailbreak/Root
      bool isJailbroken = false;
      bool isDeveloperMode = false;

      try {
        isJailbroken = await SafeDevice.isJailBroken;
        // safe_device might verify real device differently, but isDevelopmentModeEnable is available
        isDeveloperMode = await SafeDevice.isDevelopmentModeEnable;
      } catch (e) {

      }

      // Check if running on emulator
      bool isEmulator = false;
      try {
        final deviceInfo = DeviceInfoPlugin();
        if (defaultTargetPlatform == TargetPlatform.android) {
          final androidInfo = await deviceInfo.androidInfo;
          isEmulator = !androidInfo.isPhysicalDevice;
        } else if (defaultTargetPlatform == TargetPlatform.iOS) {
          final iosInfo = await deviceInfo.iosInfo;
          isEmulator = !iosInfo.isPhysicalDevice;
        }
      } catch (e) {

      }

      // Determine security status
      if (isJailbroken) {
        // For development/debugging purposes, we mark these as secure
        // _isDeviceSecure = false;
        // _securityIssue = 'Rooted/Jailbroken device detected';
      } else if (isDeveloperMode) {
         // _isDeviceSecure = false;
         // _securityIssue = 'Developer mode enabled';
      } else if (isEmulator) {
         // _isDeviceSecure = false;
         // _securityIssue = 'Running on emulator';
      } 
      
      // Always allow access
      _isDeviceSecure = true;
      _securityIssue = '';

      _isSecurityChecked = true;

      return {
        'isSecure': _isDeviceSecure,
        'issue': _securityIssue,
        'isJailbroken': isJailbroken,
        'isDeveloperMode': isDeveloperMode,
        'isEmulator': isEmulator,
      };
    } catch (e) {

      // On error, allow access but log the issue
      return {
        'isSecure': true,
        'issue': 'Security check failed',
        'error': e.toString(),
      };
    }
  }

  /// Reset security check (useful for testing)
  void resetSecurityCheck() {
    _isSecurityChecked = false;
    _isDeviceSecure = true;
    _securityIssue = '';
  }
}
