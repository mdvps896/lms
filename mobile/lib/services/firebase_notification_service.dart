import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart'; // Import ApiService

class FirebaseNotificationService {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static String? _fcmToken;

  // Get FCM Token
  static Future<String?> getFCMToken() async {
    if (_fcmToken != null) {
      return _fcmToken;
    }


    int retries = 3;
    while (retries > 0) {
      try {
        _fcmToken = await _firebaseMessaging.getToken();
        if (_fcmToken != null) {

          
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fcm_token', _fcmToken!);

          return _fcmToken;
        }
      } catch (e) {

      }
      retries--;
      if (retries > 0) await Future.delayed(const Duration(seconds: 2));
    }

    return null;
  }

  // Initialize Firebase Messaging
  static Future<void> initialize() async {
    try {

      
      // Request permission using firebase_messaging
      NotificationSettings settings = await _firebaseMessaging
          .requestPermission(alert: true, badge: true, sound: true);



      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {

        
        // Get FCM token
        await getFCMToken();
        
        // Sync token with backend if we have one
        if (_fcmToken != null) {
          try {

            final apiService = ApiService();
            final result = await apiService.saveFCMToken(_fcmToken!);
            if (result) {

            }
          } catch (e) {

          }
        } else {

        }

        // Initialize local notifications
        await _initializeLocalNotifications();

        // Listen to token refresh
        _firebaseMessaging.onTokenRefresh.listen((newToken) {

          _fcmToken = newToken;
          SharedPreferences.getInstance().then((prefs) {
            prefs.setString('fcm_token', newToken);
          });
          
          // Sync refreshed token with backend
          try {
            final apiService = ApiService();
            apiService.saveFCMToken(newToken);

          } catch (e) {

          }
        });

        FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
        FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);

        FirebaseMessaging.instance.getInitialMessage().then((message) {
          if (message != null) _handleBackgroundMessage(message);
        });
        

      } else {

      }
    } catch (e) {

    }
  }

  // Initialize Local Notifications
  static Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/launcher_icon',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {

        // Handle notification tap
      },
    );

    // Create notification channel for Android
    const androidChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(androidChannel);
  }

  // Handle foreground messages
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {


    // Show local notification
    await _showLocalNotification(message);
  }

  // Handle background messages
  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {

    
    // Navigate to specific screen based on notification data
  }

  // Show local notification
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            channelDescription:
                'This channel is used for important notifications',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/launcher_icon',
            playSound: true,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }

  // Subscribe to topic
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);

    } catch (e) {

    }
  }

  // Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);

    } catch (e) {

    }
  }
}

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {

}
