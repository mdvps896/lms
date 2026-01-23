// Dummy free materials data
class FreeMaterialsData {
  // Documents (PDFs and TXT files)
  static final List<Map<String, dynamic>> documents = [
    {
      'id': '1',
      'title': 'Flutter Complete Guide',
      'type': 'PDF',
      'size': '2.5 MB',
      'pages': '150',
      'thumbnail':
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      'downloadUrl': 'https://example.com/flutter-guide.pdf',
      'category': 'Programming',
      'uploadedDate': '2024-01-15',
    },
    {
      'id': '2',
      'title': 'React Native Basics',
      'type': 'PDF',
      'size': '1.8 MB',
      'pages': '98',
      'thumbnail':
          'https://images.unsplash.com/photo-1532619187608-e5375cab36aa?w=500',
      'downloadUrl': 'https://example.com/react-basics.pdf',
      'category': 'Programming',
      'uploadedDate': '2024-01-20',
    },
    {
      'id': '3',
      'title': 'UI/UX Design Principles',
      'type': 'PDF',
      'size': '3.2 MB',
      'pages': '200',
      'thumbnail':
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      'downloadUrl': 'https://example.com/uiux-principles.pdf',
      'category': 'Design',
      'uploadedDate': '2024-02-01',
    },
    {
      'id': '4',
      'title': 'Python Programming Notes',
      'type': 'TXT',
      'size': '450 KB',
      'pages': '50',
      'thumbnail':
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
      'downloadUrl': 'https://example.com/python-notes.txt',
      'category': 'Programming',
      'uploadedDate': '2024-02-10',
    },
    {
      'id': '5',
      'title': 'JavaScript ES6 Cheatsheet',
      'type': 'TXT',
      'size': '320 KB',
      'pages': '35',
      'thumbnail':
          'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500',
      'downloadUrl': 'https://example.com/js-cheatsheet.txt',
      'category': 'Programming',
      'uploadedDate': '2024-02-15',
    },
    {
      'id': '6',
      'title': 'Digital Marketing Guide',
      'type': 'PDF',
      'size': '4.1 MB',
      'pages': '180',
      'thumbnail':
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
      'downloadUrl': 'https://example.com/marketing-guide.pdf',
      'category': 'Marketing',
      'uploadedDate': '2024-02-20',
    },
  ];

  // Videos
  static final List<Map<String, dynamic>> videos = [
    {
      'id': '1',
      'title': 'Flutter Tutorial for Beginners',
      'duration': '45:30',
      'size': '125 MB',
      'thumbnail':
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500',
      'videoUrl': 'https://example.com/flutter-tutorial.mp4',
      'category': 'Programming',
      'views': '12.5K',
      'uploadedDate': '2024-01-10',
    },
    {
      'id': '2',
      'title': 'React Native Crash Course',
      'duration': '1:15:20',
      'size': '280 MB',
      'thumbnail':
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
      'videoUrl': 'https://example.com/react-crash-course.mp4',
      'category': 'Programming',
      'views': '8.3K',
      'uploadedDate': '2024-01-18',
    },
    {
      'id': '3',
      'title': 'UI/UX Design Masterclass',
      'duration': '2:30:45',
      'size': '450 MB',
      'thumbnail':
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      'videoUrl': 'https://example.com/uiux-masterclass.mp4',
      'category': 'Design',
      'views': '15.7K',
      'uploadedDate': '2024-01-25',
    },
    {
      'id': '4',
      'title': 'Python for Data Science',
      'duration': '1:45:15',
      'size': '320 MB',
      'thumbnail':
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
      'videoUrl': 'https://example.com/python-data-science.mp4',
      'category': 'Programming',
      'views': '20.1K',
      'uploadedDate': '2024-02-05',
    },
  ];

  // Free Tests
  static final List<Map<String, dynamic>> freeTests = [
    {
      'id': '1',
      'title': 'Flutter Basics Quiz',
      'questions': '25',
      'duration': '30 min',
      'difficulty': 'Beginner',
      'thumbnail':
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500',
      'category': 'Programming',
      'attempts': '1.2K',
    },
    {
      'id': '2',
      'title': 'React Native Assessment',
      'questions': '40',
      'duration': '45 min',
      'difficulty': 'Intermediate',
      'thumbnail':
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
      'category': 'Programming',
      'attempts': '890',
    },
    {
      'id': '3',
      'title': 'UI/UX Design Test',
      'questions': '30',
      'duration': '35 min',
      'difficulty': 'Beginner',
      'thumbnail':
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      'category': 'Design',
      'attempts': '2.5K',
    },
    {
      'id': '4',
      'title': 'Python Programming Quiz',
      'questions': '50',
      'duration': '60 min',
      'difficulty': 'Advanced',
      'thumbnail':
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
      'category': 'Programming',
      'attempts': '3.1K',
    },
  ];

  // Free Meetings
  static final List<Map<String, dynamic>> freeMeetings = [
    {
      'id': '1',
      'title': 'Flutter Development Workshop',
      'date': '2024-03-15',
      'time': '10:00 AM',
      'duration': '2 hours',
      'host': 'John Doe',
      'thumbnail':
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500',
      'meetingLink': 'https://meet.google.com/abc-defg-hij',
      'participants': '150+',
      'category': 'Programming',
    },
    {
      'id': '2',
      'title': 'UI/UX Design Session',
      'date': '2024-03-18',
      'time': '2:00 PM',
      'duration': '1.5 hours',
      'host': 'Sarah Williams',
      'thumbnail':
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      'meetingLink': 'https://meet.google.com/xyz-abcd-efg',
      'participants': '200+',
      'category': 'Design',
    },
    {
      'id': '3',
      'title': 'Python Career Guidance',
      'date': '2024-03-20',
      'time': '4:00 PM',
      'duration': '1 hour',
      'host': 'Dr. Michael Chen',
      'thumbnail':
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500',
      'meetingLink': 'https://meet.google.com/pqr-stuv-wxy',
      'participants': '300+',
      'category': 'Programming',
    },
    {
      'id': '4',
      'title': 'Digital Marketing Webinar',
      'date': '2024-03-22',
      'time': '11:00 AM',
      'duration': '2.5 hours',
      'host': 'Robert Taylor',
      'thumbnail':
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
      'meetingLink': 'https://meet.google.com/lmn-opqr-stu',
      'participants': '500+',
      'category': 'Marketing',
    },
  ];

  // Search function
  static List<Map<String, dynamic>> searchDocuments(String query) {
    if (query.isEmpty) return documents;
    return documents.where((doc) {
      final title = doc['title'].toString().toLowerCase();
      final category = doc['category'].toString().toLowerCase();
      return title.contains(query.toLowerCase()) ||
          category.contains(query.toLowerCase());
    }).toList();
  }

  static List<Map<String, dynamic>> searchVideos(String query) {
    if (query.isEmpty) return videos;
    return videos.where((video) {
      final title = video['title'].toString().toLowerCase();
      final category = video['category'].toString().toLowerCase();
      return title.contains(query.toLowerCase()) ||
          category.contains(query.toLowerCase());
    }).toList();
  }

  static List<Map<String, dynamic>> searchTests(String query) {
    if (query.isEmpty) return freeTests;
    return freeTests.where((test) {
      final title = test['title'].toString().toLowerCase();
      final category = test['category'].toString().toLowerCase();
      return title.contains(query.toLowerCase()) ||
          category.contains(query.toLowerCase());
    }).toList();
  }

  static List<Map<String, dynamic>> searchMeetings(String query) {
    if (query.isEmpty) return freeMeetings;
    return freeMeetings.where((meeting) {
      final title = meeting['title'].toString().toLowerCase();
      final category = meeting['category'].toString().toLowerCase();
      return title.contains(query.toLowerCase()) ||
          category.contains(query.toLowerCase());
    }).toList();
  }
}
