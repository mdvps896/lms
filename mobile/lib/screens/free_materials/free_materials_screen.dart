import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import 'tabs/documents_tab.dart';
import 'tabs/videos_tab.dart';
import 'tabs/free_tests_tab.dart';
import 'tabs/free_meetings_tab.dart';

class FreeMaterialsScreen extends StatefulWidget {
  final int initialTabIndex;
  
  const FreeMaterialsScreen({super.key, this.initialTabIndex = 0});

  @override
  State<FreeMaterialsScreen> createState() => _FreeMaterialsScreenState();
}

class _FreeMaterialsScreenState extends State<FreeMaterialsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 4, 
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header with title and back button
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Row(
                children: [
                  Visibility(
                    visible: Navigator.canPop(context),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppConstants.textPrimary),
                      onPressed: () => Navigator.maybePop(context),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Free Materials',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textPrimary,
                    ),
                  ),
                ],
              ),
            ),

            // Search bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: Colors.white,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey.withOpacity(0.1)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  decoration: InputDecoration(
                    hintText: 'Search free materials...',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                    prefixIcon: const Icon(Icons.search, color: AppConstants.primaryColor, size: 22),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.grey, size: 20),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),

            // Tab bar
            Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                labelColor: AppConstants.primaryColor,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppConstants.primaryColor,
                indicatorWeight: 3,
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(
                    icon: Icon(Icons.description, size: 20),
                    text: 'Documents',
                  ),
                  Tab(
                    icon: Icon(Icons.video_library, size: 20),
                    text: 'Videos',
                  ),
                  Tab(
                    icon: Icon(Icons.quiz, size: 20),
                    text: 'Free Tests',
                  ),
                  Tab(
                    icon: Icon(Icons.video_call, size: 20),
                    text: 'Meetings',
                  ),
                ],
              ),
            ),

            // Tab views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  DocumentsTab(searchQuery: _searchQuery),
                  VideosTab(searchQuery: _searchQuery),
                  FreeTestsTab(searchQuery: _searchQuery),
                  FreeMeetingsTab(searchQuery: _searchQuery),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
