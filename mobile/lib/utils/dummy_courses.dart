// Dummy course data with images
class DummyCourses {
  static final List<Map<String, dynamic>> courses = [
    // Flutter & Mobile Development
    {
      'id': '1',
      'title': 'Master Flutter Development',
      'description': 'Complete Flutter course from beginner to advanced',
      'category': 'Code',
      'price': '499',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500',
      'instructor': 'John Doe',
      'duration': '25h 30m',
      'students': '12,450',
    },
    {
      'id': '2',
      'title': 'React Native Masterclass',
      'description': 'Build iOS and Android apps with React Native',
      'category': 'Code',
      'price': '599',
      'rating': '4.7',
      'thumbnail': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
      'instructor': 'Jane Smith',
      'duration': '30h 15m',
      'students': '8,920',
    },
    {
      'id': '3',
      'title': 'iOS Development with Swift',
      'description': 'Complete iOS app development course',
      'category': 'Code',
      'price': '799',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500',
      'instructor': 'Mike Johnson',
      'duration': '35h 20m',
      'students': '6,780',
    },

    // UI/UX Design
    {
      'id': '4',
      'title': 'UI/UX Design Professional',
      'description': 'Master Figma, Adobe XD & Prototyping',
      'category': 'Design',
      'price': '699',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      'instructor': 'Sarah Williams',
      'duration': '28h 45m',
      'students': '15,230',
    },
    {
      'id': '5',
      'title': 'Graphic Design Masterclass',
      'description': 'Adobe Photoshop, Illustrator & InDesign',
      'category': 'Design',
      'price': '549',
      'rating': '4.6',
      'thumbnail': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500',
      'instructor': 'David Brown',
      'duration': '22h 30m',
      'students': '9,450',
    },
    {
      'id': '6',
      'title': 'Web Design Complete Course',
      'description': 'HTML, CSS, JavaScript & Responsive Design',
      'category': 'Design',
      'price': '399',
      'rating': '4.7',
      'thumbnail': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=500',
      'instructor': 'Emily Davis',
      'duration': '20h 15m',
      'students': '18,670',
    },

    // Business & Marketing
    {
      'id': '7',
      'title': 'Digital Marketing Mastery',
      'description': 'SEO, Social Media, Email & Content Marketing',
      'category': 'Business',
      'price': '899',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
      'instructor': 'Robert Taylor',
      'duration': '32h 40m',
      'students': '22,340',
    },
    {
      'id': '8',
      'title': 'Business Strategy & Planning',
      'description': 'Strategic management and business planning',
      'category': 'Business',
      'price': '999',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
      'instructor': 'Lisa Anderson',
      'duration': '26h 20m',
      'students': '11,890',
    },
    {
      'id': '9',
      'title': 'Entrepreneurship Bootcamp',
      'description': 'Start and grow your own business',
      'category': 'Business',
      'price': '1299',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500',
      'instructor': 'James Wilson',
      'duration': '40h 10m',
      'students': '7,560',
    },

    // Data Science & AI
    {
      'id': '10',
      'title': 'Data Science Bootcamp',
      'description': 'Python, Machine Learning & AI Projects',
      'category': 'Code',
      'price': '999',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500',
      'instructor': 'Dr. Michael Chen',
      'duration': '45h 30m',
      'students': '19,450',
    },
    {
      'id': '11',
      'title': 'Machine Learning A-Z',
      'description': 'Hands-on Python & R in Data Science',
      'category': 'Code',
      'price': '1199',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500',
      'instructor': 'Dr. Anna Martinez',
      'duration': '42h 15m',
      'students': '16,780',
    },
    {
      'id': '12',
      'title': 'Deep Learning Specialization',
      'description': 'Neural Networks and Deep Learning',
      'category': 'Code',
      'price': '1499',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500',
      'instructor': 'Dr. Kevin Lee',
      'duration': '50h 45m',
      'students': '14,230',
    },

    // Web Development
    {
      'id': '13',
      'title': 'Full Stack Web Development',
      'description': 'MERN Stack - MongoDB, Express, React, Node',
      'category': 'Code',
      'price': '899',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=500',
      'instructor': 'Chris Martin',
      'duration': '38h 20m',
      'students': '21,340',
    },
    {
      'id': '14',
      'title': 'Advanced JavaScript Course',
      'description': 'ES6+, Async/Await, Promises & More',
      'category': 'Code',
      'price': '599',
      'rating': '4.7',
      'thumbnail': 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500',
      'instructor': 'Tom Harris',
      'duration': '24h 30m',
      'students': '17,890',
    },
    {
      'id': '15',
      'title': 'Python for Everybody',
      'description': 'Complete Python programming course',
      'category': 'Code',
      'price': '499',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
      'instructor': 'Dr. Charles White',
      'duration': '28h 45m',
      'students': '25,670',
    },

    // Photography & Video
    {
      'id': '16',
      'title': 'Professional Photography',
      'description': 'Master DSLR, Lighting & Composition',
      'category': 'Design',
      'price': '799',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500',
      'instructor': 'Alex Turner',
      'duration': '26h 15m',
      'students': '12,450',
    },
    {
      'id': '17',
      'title': 'Video Editing Masterclass',
      'description': 'Adobe Premiere Pro & After Effects',
      'category': 'Design',
      'price': '699',
      'rating': '4.7',
      'thumbnail': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500',
      'instructor': 'Rachel Green',
      'duration': '30h 20m',
      'students': '10,890',
    },

    // Live Courses
    {
      'id': '18',
      'title': 'Live: Web3 & Blockchain',
      'description': 'Interactive live sessions on blockchain technology',
      'category': 'Live',
      'price': '1999',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500',
      'instructor': 'Mark Thompson',
      'duration': 'Live Sessions',
      'students': '3,450',
    },
    {
      'id': '19',
      'title': 'Live: DevOps Engineering',
      'description': 'Docker, Kubernetes & CI/CD',
      'category': 'Live',
      'price': '1799',
      'rating': '4.8',
      'thumbnail': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=500',
      'instructor': 'Steven Clark',
      'duration': 'Live Sessions',
      'students': '4,230',
    },
    {
      'id': '20',
      'title': 'Live: Cloud Computing AWS',
      'description': 'Amazon Web Services certification prep',
      'category': 'Live',
      'price': '2199',
      'rating': '4.9',
      'thumbnail': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
      'instructor': 'Jennifer Lopez',
      'duration': 'Live Sessions',
      'students': '5,670',
    },
  ];

  // Get courses by category
  static List<Map<String, dynamic>> getCoursesByCategory(String category) {
    if (category == 'All') {
      return courses;
    }
    return courses.where((course) => course['category'] == category).toList();
  }

  // Search courses
  static List<Map<String, dynamic>> searchCourses(String query) {
    if (query.isEmpty) {
      return courses;
    }
    return courses.where((course) {
      final title = course['title']?.toString().toLowerCase() ?? '';
      final description = course['description']?.toString().toLowerCase() ?? '';
      return title.contains(query.toLowerCase()) || 
             description.contains(query.toLowerCase());
    }).toList();
  }
}
