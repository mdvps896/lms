import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../utils/constants.dart';
import '../../../models/user_model.dart';
import '../../../services/api_service.dart';
import 'package:intl/intl.dart';

class InfoTab extends StatefulWidget {
  final User user;
  final VoidCallback onUpdate;

  const InfoTab({super.key, required this.user, required this.onUpdate});

  @override
  State<InfoTab> createState() => _InfoTabState();
}

class _InfoTabState extends State<InfoTab> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  bool _isUpdating = false;

  Future<void> _pickAndUploadImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _isUpdating = true);
      try {
        final bytes = await image.readAsBytes();
        final url = await _apiService.uploadImage(
          bytes,
          image.name,
          folder: 'profile',
        );
        if (url != null) {
          final result = await _apiService.updateProfile({'profileImage': url});
          if (result['success'] == true) {
            widget.onUpdate();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile picture updated!')),
              );
            }
          }
        }
      } catch (e) {

      } finally {
        if (mounted) setState(() => _isUpdating = false);
      }
    }
  }

  void _showEditSheet({
    required String title,
    required Map<String, String> fields,
    required Function(Map<String, String>) onSave,
  }) {
    final controllers = <String, TextEditingController>{};
    fields.forEach((key, value) {
      controllers[key] = TextEditingController(text: value);
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                ...controllers.entries.map(
                  (entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: TextField(
                      controller: entry.value,
                      decoration: InputDecoration(
                        labelText: entry.key.replaceFirst(
                          entry.key[0],
                          entry.key[0].toUpperCase(),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      final result = <String, String>{};
                      controllers.forEach((key, controller) {
                        result[key] = controller.text;
                      });
                      Navigator.pop(context);
                      onSave(result);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.primaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Save Changes',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.user;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile Image Edit Button (Visible in Info Tab for easy access)
          _buildEditProfileImage(),
          const SizedBox(height: 20),

          _buildAccordionItem(
            context,
            'Personal Info',
            Icons.person_outline,
            [
              _buildInfoRow(Icons.person, 'Full Name', user.name),
              _buildInfoRow(
                Icons.email,
                'Email Address',
                user.email.endsWith('@mobile.local') ? 'Not provided' : user.email,
                isEditable: user.email.endsWith('@mobile.local'),
              ),
              _buildInfoRow(
                Icons.phone,
                'Phone Number',
                user.phone ?? 'Not provided',
                isEditable: user.phone == null || user.phone!.isEmpty || user.phone == 'Not provided',
              ),
              _buildInfoRow(
                Icons.verified_user,
                'Account Type',
                user.role.toUpperCase(),
                isEditable: false,
              ),
            ],
            initiallyExpanded: true,
            onEdit: () {
              final isDummyEmail = user.email.endsWith('@mobile.local');
              final isPhoneEditable = user.phone == null || user.phone!.isEmpty || user.phone == 'Not provided';
              
              _showEditSheet(
                title: 'Edit Personal Info',
                fields: {
                  'name': user.name,
                  if (isDummyEmail) 'email': '',
                  if (isPhoneEditable) 'phone': user.phone ?? '',
                },
                onSave: (data) async {
                  setState(() => _isUpdating = true);
                  final res = await _apiService.updateProfile(data);
                  setState(() => _isUpdating = false);
                  
                  if (res['success'] == true) {
                    widget.onUpdate();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Profile updated successfully!')),
                      );
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(res['message'] ?? 'Failed to update profile')),
                      );
                    }
                  }
                },
              );
            },
          ),
          const SizedBox(height: 12),
          _buildAccordionItem(
            context,
            'Address Details',
            Icons.location_on_outlined,
            [
              _buildInfoRow(
                Icons.home,
                'Street Address',
                user.address ?? 'Not set',
              ),
              _buildInfoRow(
                Icons.location_city,
                'City',
                user.city ?? 'Not set',
              ),
              _buildInfoRow(Icons.map, 'State', user.state ?? 'Not set'),
              _buildInfoRow(
                Icons.pin_drop,
                'Pincode',
                user.pincode ?? 'Not set',
              ),
            ],
            onEdit:
                () => _showEditSheet(
                  title: 'Edit Address',
                  fields: {
                    'address': user.address ?? '',
                    'city': user.city ?? '',
                    'state': user.state ?? '',
                    'pincode': user.pincode ?? '',
                  },
                  onSave: (data) async {
                    final res = await _apiService.updateProfile(data);
                    if (res['success'] == true) widget.onUpdate();
                  },
                ),
          ),
          const SizedBox(height: 12),
          _buildAccordionItem(
            context,
            'Academy Detail',
            Icons.account_balance_outlined,
            [
              _buildInfoRow(
                Icons.badge,
                'Roll Number',
                user.rollNumber ?? 'Not assigned',
                isEditable: false,
              ),
              _buildInfoRow(
                Icons.category,
                'Current Category',
                _getCategoryName(),
                isEditable: false,
              ),
              _buildInfoRow(
                Icons.calendar_today,
                'Joining Date',
                user.createdAt != null
                    ? DateFormat('MMM d, yyyy').format(user.createdAt!)
                    : 'N/A',
                isEditable: false,
              ),
              _buildInfoRow(
                Icons.play_circle_outline,
                'Enrolled Courses',
                '${user.enrolledCourses?.length ?? 0}',
                isEditable: false,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEditProfileImage() {
    return GestureDetector(
      onTap: _isUpdating ? null : _pickAndUploadImage,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppConstants.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.camera_alt, size: 16, color: AppConstants.primaryColor),
            const SizedBox(width: 8),
            Text(
              _isUpdating ? 'Updating...' : 'Change Profile Picture',
              style: const TextStyle(
                color: AppConstants.primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCategoryName() {
    if (widget.user.category == null) return 'None';
    if (widget.user.category is Map) {
      return widget.user.category['name'] ?? 'N/A';
    }
    return widget.user.category.toString();
  }

  Widget _buildAccordionItem(
    BuildContext context,
    String title,
    IconData icon,
    List<Widget> children, {
    bool initiallyExpanded = false,
    VoidCallback? onEdit,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: initiallyExpanded,
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppConstants.primaryColor, size: 20),
          ),
          title: Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          trailing:
              onEdit != null
                  ? IconButton(
                    icon: const Icon(Icons.edit, size: 18, color: Colors.grey),
                    onPressed: onEdit,
                  )
                  : null,
          childrenPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 8,
          ),
          children: children,
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    IconData icon,
    String label,
    String value, {
    bool isEditable = true,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[400], size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color:
                        isEditable ? AppConstants.textPrimary : Colors.black45,
                  ),
                ),
              ],
            ),
          ),
          if (!isEditable)
            const Icon(Icons.lock_outline, size: 14, color: Colors.grey),
        ],
      ),
    );
  }
}
