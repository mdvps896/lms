import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../services/api/base_api_service.dart';
import '../utils/constants.dart';
import '../models/user_model.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();

  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  User? _user;
  Map<String, dynamic>? _settings;
  Timer? _timer;
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _whatsappEnabled = true; // Check if WhatsApp is enabled from backend
  bool _showChat = false; // Show chat only if WhatsApp fails

  @override
  void initState() {
    super.initState();
    _checkWhatsAppSupport();
  }

  Future<void> _checkWhatsAppSupport() async {
    // Check if backend has WhatsApp configured
    _settings = await _apiService.getSettings();
    final whatsappSettings = _settings?['whatsappSupport'];
    final whatsappNumber = whatsappSettings?['phoneNumber'];
    final primaryMethod = whatsappSettings?['primaryMethod'];
    
    // Check if WhatsApp is the preferred method
    bool isWhatsAppPrimary = primaryMethod == 'whatsapp';

    setState(() {
      _whatsappEnabled = whatsappNumber != null && whatsappNumber.toString().isNotEmpty;
      // Show chat if WhatsApp is NOT primary, or if it is primary but not configured
      _showChat = !isWhatsAppPrimary || !_whatsappEnabled;
      _isLoading = false;
    });

    // Always load data so we can show history even if in WhatsApp mode
    _loadInitialData();
    _startPolling();
  }

  void _startPolling() {
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (mounted) _fetchMessages(isPolling: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioPlayer.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    // Refresh user profile to get latest blocked status
    _user = await _apiService.refreshUserProfile(); 
    _user ??= await _apiService.getSavedUser();
    
    _settings = await _apiService.getSettings();
    await _fetchMessages();
    setState(() => _isLoading = false);
    _scrollToBottom();
  }

  Future<void> _fetchMessages({bool isPolling = false}) async {
    final messages = await _apiService.getSupportMessages();

    // Check if new message arrived (especially from admin)
    if (messages.length > _messages.length) {
      final lastMsg = messages.last;
      bool isAdminMsg = lastMsg['isAdmin'] == true;

      setState(() {
        _messages = messages;
      });
      _scrollToBottom();

      // Play sound if polling (new message from admin) or if manual and last is admin
      if (isAdminMsg && isPolling) {
        _playSound();
      }
    } else if (!isPolling) {
      setState(() {
        _messages = messages;
      });
      _scrollToBottom();
    }
  }

  Future<void> _playSound() async {
    try {
      final chatSound = _settings?['chatNotificationSound'];
      if (chatSound != null && chatSound['enabled'] == true) {
        final soundFile = chatSound['soundFile'] ?? '/sounds/notification.mp3';
        final volume = (chatSound['volume'] ?? 0.7).toDouble();
        final url = _apiService.getFullUrl(soundFile);

        await _audioPlayer.setVolume(volume);
        await _audioPlayer.play(UrlSource(url));
      }
    } catch (e) {
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickAndSendImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    setState(() => _isSending = true);

    try {
      final bytes = await image.readAsBytes();
      final imageUrl = await _apiService.uploadImage(bytes, image.name);

      if (imageUrl != null) {
        await _apiService.sendSupportMessage(images: [imageUrl]);
        await _fetchMessages();
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to upload image: $e')));
    } finally {
      setState(() => _isSending = false);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    setState(() {
      // Optimistic update
      _messages.add({
        'text': text,
        'isAdmin': false,
        'createdAt': DateTime.now().toIso8601String(),
        'sender': _user?.id,
      });
      _isSending = true;
    });
    _scrollToBottom();

    try {
      await _apiService.sendSupportMessage(text: text);
      _playSound(); // Play sound on send
      await _fetchMessages();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to send message: $e')));
    } finally {
      setState(() => _isSending = false);
    }
  }

  Future<void> _openWhatsApp() async {
    try {
      // Get WhatsApp number from backend settings
      final whatsappNumber = _settings?['whatsappSupport']?['phoneNumber'] ?? '+919876543210';
      final whatsappMessage = _settings?['whatsappSupport']?['message'] ?? 
          'Hello, I need support with MD Consultancy app.';
      
      final Uri whatsappUrl = Uri.parse(
        'https://wa.me/$whatsappNumber?text=${Uri.encodeComponent(whatsappMessage)}'
      );
      
      if (await canLaunchUrl(whatsappUrl)) {
        await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('WhatsApp is not installed on this device')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to open WhatsApp: $e')),
        );
      }
    }
  }

  String _formatImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    // Use getFullUrl for consistent URL formatting
    return _apiService.getFullUrl(url);
  }

  void _showFullImage(String url) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FullImageScreen(imageUrl: _formatImageUrl(url)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final siteLogo = _settings?['general']?['siteLogo'] ?? '';
    const String adminName = 'MD Consultancy';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        titleSpacing: 0,
        leading:
            Navigator.canPop(context)
                ? IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black),
                  onPressed: () => Navigator.maybePop(context),
                )
                : null,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey[100],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/logo_padded.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  adminName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Row(
                  children: [
                    CircleAvatar(radius: 4, backgroundColor: Colors.green),
                    SizedBox(width: 4),
                    Text(
                      'Online Support',
                      style: TextStyle(
                        color: Colors.green,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _fetchMessages,
                    color: AppConstants.primaryColor,
                    child: _messages.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            controller: _scrollController,
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(16),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) {
                                  final msg = _messages[index];
                                  final isAdmin = msg['isAdmin'] ?? false;
                                  return _buildChatBubble(msg, isAdmin);
                                },
                              ),
                      ),
                    ),
                    _buildInputArea(),
                  ],
                ),
    );
  }

  Widget _buildWhatsAppOnlyUI() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.green[50],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 60,
                color: Colors.green[700],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Need Help?',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Contact us directly on WhatsApp for instant support',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: _openWhatsApp,
              icon: Icon(Icons.chat, size: 24),
              label: const Text(
                'Open WhatsApp',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
                elevation: 4,
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                setState(() {
                  _showChat = true;
                });
                _loadInitialData();
                _startPolling();
              },
              child: Text(
                'Or use in-app chat',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.6,
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.support_agent_rounded,
              size: 80,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            const Text(
              'How can we help you?',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Start a conversation with our admin.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatBubble(Map<String, dynamic> msg, bool isAdmin) {
    final hasImages =
        msg['images'] != null && (msg['images'] as List).isNotEmpty;
    final time = DateTime.tryParse(msg['createdAt'] ?? '') ?? DateTime.now();
    final timeFormatted = DateFormat('hh:mm a').format(time);

    return Align(
      alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isAdmin ? Colors.grey[100] : AppConstants.primaryColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isAdmin ? Radius.zero : const Radius.circular(16),
            bottomRight: isAdmin ? const Radius.circular(16) : Radius.zero,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasImages)
              ...List.generate((msg['images'] as List).length, (i) {
                final url = msg['images'][i].toString();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: GestureDetector(
                    onTap: () => _showFullImage(url),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        color: Colors.white,
                        constraints: const BoxConstraints(
                          maxHeight: 220,
                          maxWidth: 220,
                        ),
                        child: Image.network(
                          _formatImageUrl(url),
                          fit: BoxFit.contain,
                          filterQuality: FilterQuality.high,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return SizedBox(
                              height: 150,
                              width: 150,
                              child: const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 100,
                              width: 100,
                              color: Colors.grey[200],
                              child: const Icon(
                                Icons.broken_image,
                                color: Colors.grey,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                );
              }),
            if (msg['text'] != null && msg['text'].toString().isNotEmpty)
              Text(
                msg['text'],
                style: TextStyle(
                  color: isAdmin ? Colors.black87 : Colors.white,
                  fontSize: 15,
                ),
              ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  timeFormatted,
                  style: TextStyle(
                    color: isAdmin ? Colors.black45 : Colors.white70,
                    fontSize: 10,
                  ),
                ),
                if (!isAdmin) ...[
                  const SizedBox(width: 4),
                  Icon(
                    Icons.done_all,
                    size: 12,
                    color:
                        (msg['isRead'] == true) ? Colors.blue : Colors.white70,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    // Check if user is blocked
    if (_user?.isSupportBlocked == true) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).padding.bottom + 16,
        ),
        color: Colors.red[50],
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.block, color: Colors.red, size: 24),
            const SizedBox(height: 8),
            const Text(
              'You are blocked from sending messages.',
              style: TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Please contact administration for support.',
              style: TextStyle(
                color: Colors.red[700],
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    // If WhatsApp is primary mode (and enabled), show only the big button
    if (!_showChat && _whatsappEnabled) {
      return Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 12,
          bottom: MediaQuery.of(context).padding.bottom + 12,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _openWhatsApp,
            icon: const Icon(Icons.chat_bubble_outline), 
            label: const Text(
              'Chat on WhatsApp',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                 borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: _pickAndSendImage,
            icon: const Icon(
              Icons.image_outlined,
              color: AppConstants.primaryColor,
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  border: InputBorder.none,
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isSending ? null : _sendMessage,
            child: CircleAvatar(
              backgroundColor: AppConstants.primaryColor,
              child:
                  _isSending
                      ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                      : const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
            ),
          ),
        ],
      ),
    );
  }
}

class FullImageScreen extends StatelessWidget {
  final String imageUrl;
  const FullImageScreen({super.key, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: InteractiveViewer(
              child: Image.network(
                imageUrl,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const CircularProgressIndicator(color: Colors.white);
                },
                errorBuilder:
                    (context, error, stackTrace) => const Icon(
                      Icons.broken_image,
                      color: Colors.white,
                      size: 50,
                    ),
              ),
            ),
          ),
          Positioned(
            top: 40,
            left: 20,
            child: CircleAvatar(
              backgroundColor: Colors.black54,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
