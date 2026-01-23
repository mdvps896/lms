class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? profileImage;
  final String? phone;
  final String? rollNumber;
  final DateTime? createdAt;
  final dynamic category;
  final List<dynamic>? enrolledCourses;

  // Address fields
  final String? address;
  final String? city;
  final String? state;
  final String? pincode;
  final bool twoFactorEnabled;
  final bool notificationsEnabled;
  final bool isSupportBlocked;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.profileImage,
    this.phone,
    this.rollNumber,
    this.createdAt,
    this.category,
    this.enrolledCourses,
    this.address,
    this.city,
    this.state,
    this.pincode,
    this.twoFactorEnabled = false,
    this.notificationsEnabled = true,
    this.isSupportBlocked = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'student',
      profileImage: json['image'] ?? json['profileImage'],
      phone: json['phone'],
      rollNumber: json['rollNumber'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      category:
          json['category'] is Map ? json['category']['name'] : json['category'],
      enrolledCourses:
          json['enrolledCourses'] is List ? json['enrolledCourses'] : [],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      pincode: json['pincode'],
      twoFactorEnabled: json['twoFactorEnabled'] ?? false,
      notificationsEnabled: json['notificationsEnabled'] ?? true,
      isSupportBlocked: json['isSupportBlocked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'image': profileImage,
      'phone': phone,
      'rollNumber': rollNumber,
      'createdAt': createdAt?.toIso8601String(),
      'category': category,
      'enrolledCourses': enrolledCourses,
      'address': address,
      'city': city,
      'state': state,
      'pincode': pincode,
      'twoFactorEnabled': twoFactorEnabled,
      'notificationsEnabled': notificationsEnabled,
      'isSupportBlocked': isSupportBlocked,
    };
  }
}
