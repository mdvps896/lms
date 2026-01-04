import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart';
import '../../models/user_model.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = true;
  bool _notificationsEnabled = true;
  bool _twoFactorEnabled = false;
  String _selectedLanguage = 'English';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final user = await _apiService.getSavedUser();
    if (user != null) {
      setState(() {
        _user = user;
        _notificationsEnabled = user.notificationsEnabled;
        _twoFactorEnabled = user.twoFactorEnabled;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isLoading = true);
    
    try {
      // Save Notifications
      final notifResult = await _apiService.toggleNotifications(_notificationsEnabled);
      // Save 2FA
      final tfaResult = await _apiService.toggle2FA(_twoFactorEnabled);
      
      if (mounted) {
        if (notifResult['success'] && tfaResult['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Settings saved successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          _loadUserData(); // Refresh local user data
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(notifResult['message'] ?? tfaResult['message'] ?? 'Failed to save some settings'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('An error occurred while saving settings')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: [
                const SizedBox(height: 10),
                _buildSectionHeader('General Settings'),
                _buildSettingTile(
                  Icons.notifications_active_outlined,
                  'Push Notifications',
                  _notificationsEnabled ? 'Status: Enabled' : 'Status: Disabled',
                  isToggled: _notificationsEnabled,
                  trailing: Switch(
                    value: _notificationsEnabled,
                    onChanged: _showNotificationConfirmationDialog,
                    activeColor: Colors.red,
                    activeTrackColor: Colors.red.withOpacity(0.5),
                    inactiveThumbColor: Colors.yellow[700],
                    inactiveTrackColor: Colors.yellow[100],
                  ),
                ),
                _buildSettingTile(
                  Icons.language_outlined,
                  'Language',
                  _selectedLanguage,
                  onTap: () => _showLanguageDialog(),
                ),
                
                const Divider(height: 32),
                _buildSectionHeader('Account & Security'),
                _buildSettingTile(
                  Icons.lock_outline,
                  'Change Password',
                  'Update your login password',
                  onTap: () => _showChangePasswordDialog(),
                ),
                _buildSettingTile(
                  Icons.security_outlined,
                  'Two-Step Verification',
                  _twoFactorEnabled ? 'Status: Enabled' : 'Status: Disabled',
                  isToggled: _twoFactorEnabled,
                  trailing: Switch(
                    value: _twoFactorEnabled,
                    onChanged: _show2FAConfirmationDialog,
                    activeColor: Colors.red,
                    activeTrackColor: Colors.red.withOpacity(0.5),
                    inactiveThumbColor: Colors.yellow[700],
                    inactiveTrackColor: Colors.yellow[100],
                  ),
                ),

                const Divider(height: 32),
                _buildSectionHeader('App Info'),
                _buildSettingTile(
                  Icons.info_outline,
                  'Version',
                  '1.0.0',
                ),
                _buildSettingTile(
                  Icons.update,
                  'Check for Updates',
                  'Latest version installed',
                  onTap: () {},
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
          
          // Save Button at the bottom
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveSettings,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text(
                      'SAVE SETTINGS',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppConstants.primaryColor,
          fontWeight: FontWeight.bold,
          fontSize: 14,
          letterSpacing: 1.1,
        ),
      ),
    );
  }

  Widget _buildSettingTile(IconData icon, String title, String subtitle, {Widget? trailing, VoidCallback? onTap, bool? isToggled}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!, width: 1.5), // Clear 1px+ border
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppConstants.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppConstants.primaryColor, size: 22),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
        subtitle: Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        trailing: trailing != null 
          ? Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey[300]!, width: 1), // 1px border around toggle
              ),
              child: trailing,
            )
          : (onTap != null ? const Icon(Icons.chevron_right, color: Colors.grey) : null),
      ),
    );
  }

  void _showNotificationConfirmationDialog(bool value) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Row(
          children: [
            Icon(
              value ? Icons.notifications_active : Icons.notifications_off,
              color: value ? Colors.green : Colors.red,
            ),
            const SizedBox(width: 10),
            Text(value ? 'Enable Notifications?' : 'Disable Notifications?'),
          ],
        ),
        content: Text(
          value 
            ? 'By enabling notifications, you will receive important updates about your exams, results, and new courses. Do you want to proceed?'
            : 'Are you sure you want to disable notifications? You might miss important updates and announcements.',
          style: const TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() => _notificationsEnabled = value);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: value ? Colors.green : Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(value ? 'Yes, Enable' : 'Yes, Disable'),
          ),
        ],
      ),
    );
  }

  void _show2FAConfirmationDialog(bool value) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Row(
          children: [
            Icon(
              value ? Icons.security : Icons.warning_amber_rounded,
              color: value ? Colors.green : Colors.orange,
            ),
            const SizedBox(width: 10),
            Text(value ? 'Enable 2FA?' : 'Disable 2FA?'),
          ],
        ),
        content: Text(
          value 
            ? 'For extra security, we will send a 6-digit verification code to your email every time you log in. Do you want to enable this?'
            : 'Are you sure you want to disable 2FA? Your account will be less secure and won\'t require email verification at login.',
          style: const TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() => _twoFactorEnabled = value);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: value ? AppConstants.primaryColor : Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(value ? 'Yes, Enable' : 'Yes, Disable'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['English', 'Hindi', 'Marathi', 'Gujarati'].map((lang) {
            return RadioListTile<String>(
              title: Text(lang),
              value: lang,
              groupValue: _selectedLanguage,
              onChanged: (val) {
                setState(() => _selectedLanguage = val!);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showChangePasswordDialog() {
    final oldController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    bool isSavingState = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setLocalState) => AlertDialog(
          title: const Text('Change Password'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: oldController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Old Password'),
              ),
              TextField(
                controller: newController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New Password'),
              ),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm New Password'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: isSavingState ? null : () async {
                if (newController.text != confirmController.text) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
                  return;
                }
                setLocalState(() => isSavingState = true);
                final result = await _apiService.changePassword(oldController.text, newController.text);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'])));
                  if (result['success']) Navigator.pop(context);
                  setLocalState(() => isSavingState = false);
                }
              },
              child: isSavingState ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
