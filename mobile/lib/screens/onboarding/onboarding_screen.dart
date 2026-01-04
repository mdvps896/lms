import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../utils/constants.dart';
import '../login_screen.dart';
import 'dart:async';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  late AnimationController _animationController;
  late Animation<double> _progressAnimation;
  Timer? _autoAdvanceTimer;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    
    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    
    _animationController.forward();
    _startAutoAdvance();
  }

  void _startAutoAdvance() {
    _autoAdvanceTimer = Timer(const Duration(milliseconds: 2500), () {
      if (_currentPage < 2) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      } else {
        _finishOnboarding();
      }
    });
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    _animationController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
              _animationController.reset();
              _animationController.forward();
              _autoAdvanceTimer?.cancel();
              _startAutoAdvance();
            },
            children: [
              _buildSplashScreen1(),
              _buildSplashScreen2(),
              _buildSplashScreen3(),
            ],
          ),
          
          // Skip button
          Positioned(
            top: 40,
            right: 20,
            child: SafeArea(
              child: TextButton(
                onPressed: _finishOnboarding,
                child: Text(
                  'Skip',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
          
          // Page indicators
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? Color(0xFFD32F2F)
                        : Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  // Screen 1: Colorful splash with crown
  Widget _buildSplashScreen1() {
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.2,
          colors: [
            Color(0xFFFFF8F0),
            Color(0xFFFFFFFF),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Colorful decorative elements
          Positioned(
            top: 100,
            left: 30,
            child: _buildColorfulIcon(Icons.palette, Colors.blue.shade200, 40),
          ),
          Positioned(
            top: 120,
            right: 40,
            child: _buildColorfulIcon(Icons.star, Colors.amber.shade300, 35),
          ),
          Positioned(
            bottom: 250,
            left: 50,
            child: _buildColorfulIcon(Icons.favorite, Colors.pink.shade200, 38),
          ),
          Positioned(
            bottom: 200,
            right: 60,
            child: _buildColorfulIcon(Icons.lightbulb, Colors.purple.shade200, 42),
          ),
          
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Crown with colorful splash effect
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        Colors.pink.shade100,
                        Colors.blue.shade100,
                        Colors.purple.shade100,
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.purple.withOpacity(0.3),
                        blurRadius: 30,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: ClipOval(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Image.asset(
                            'assets/logo.png',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                
                SizedBox(height: 40),
                
                Text(
                  'GOD OF',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFD32F2F),
                    letterSpacing: 3,
                  ),
                ),
                Text(
                  'GRAPHICS',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFD32F2F),
                    letterSpacing: 3,
                  ),
                ),
                
                SizedBox(height: 80),
                
                Text(
                  'Loading Creativity...',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    letterSpacing: 1,
                  ),
                ),
                
                SizedBox(height: 16),
                
                _buildProgressBar(Colors.red),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Screen 2: Minimalist gradient design
  Widget _buildSplashScreen2() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFFFFBF5),
            Color(0xFFFFF8ED),
            Color(0xFFFFFFFF),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Subtle floating icons
          Positioned(
            top: 80,
            left: 40,
            child: _buildFloatingIcon(Icons.menu_book, 0.15, 60),
          ),
          Positioned(
            top: 150,
            right: 30,
            child: _buildFloatingIcon(Icons.school, 0.1, 50),
          ),
          Positioned(
            bottom: 200,
            left: 50,
            child: _buildFloatingIcon(Icons.lightbulb_outline, 0.12, 55),
          ),
          Positioned(
            bottom: 300,
            right: 60,
            child: _buildFloatingIcon(Icons.emoji_events, 0.08, 45),
          ),
          
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.workspace_premium,
                  size: 60,
                  color: Color(0xFFD32F2F),
                ),
                SizedBox(height: 20),
                
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Image.asset(
                        'assets/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                
                SizedBox(height: 30),
                
                Text(
                  AppConstants.appName.toUpperCase(),
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFD32F2F),
                    letterSpacing: 2,
                  ),
                ),
                
                SizedBox(height: 12),
                
                Text(
                  'Designing Creative Gods',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    letterSpacing: 0.5,
                  ),
                ),
                
                SizedBox(height: 80),
                
                Text(
                  'Loading Creativity...',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    letterSpacing: 1,
                  ),
                ),
                
                SizedBox(height: 16),
                
                _buildProgressBar(Color(0xFFD32F2F)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Screen 3: Final completion screen
  Widget _buildSplashScreen3() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFF5F5),
            Color(0xFFFFFFFF),
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Color(0xFFD32F2F),
                    Color(0xFFFF5252),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFFD32F2F).withOpacity(0.4),
                    blurRadius: 30,
                    spreadRadius: 10,
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: ClipOval(
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Image.asset(
                        'assets/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            SizedBox(height: 40),
            
            Text(
              'Welcome to',
              style: TextStyle(
                fontSize: 20,
                color: Colors.grey[600],
                letterSpacing: 1,
              ),
            ),
            
            SizedBox(height: 8),
            
            Text(
              AppConstants.appName.toUpperCase(),
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xFFD32F2F),
                letterSpacing: 2,
              ),
            ),
            
            SizedBox(height: 16),
            
            Text(
              'Premium Design Institute',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
                letterSpacing: 0.5,
              ),
            ),
            
            SizedBox(height: 80),
            
            Text(
              'Getting Ready...',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
                letterSpacing: 1,
              ),
            ),
            
            SizedBox(height: 16),
            
            _buildProgressBar(Color(0xFFD32F2F)),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar(Color color) {
    return Container(
      width: 200,
      height: 4,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(2),
      ),
      child: AnimatedBuilder(
        animation: _progressAnimation,
        builder: (context, child) {
          return Align(
            alignment: Alignment.centerLeft,
            child: Container(
              width: 200 * _progressAnimation.value,
              height: 4,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFloatingIcon(IconData icon, double opacity, double size) {
    return TweenAnimationBuilder(
      tween: Tween<double>(begin: 0, end: 1),
      duration: Duration(milliseconds: 1500),
      builder: (context, double value, child) {
        return Transform.translate(
          offset: Offset(0, -20 * (1 - value)),
          child: Opacity(
            opacity: opacity * value,
            child: Icon(
              icon,
              size: size,
              color: Color(0xFFFFE0B2),
            ),
          ),
        );
      },
    );
  }

  Widget _buildColorfulIcon(IconData icon, Color color, double size) {
    return TweenAnimationBuilder(
      tween: Tween<double>(begin: 0, end: 1),
      duration: Duration(milliseconds: 1200),
      builder: (context, double value, child) {
        return Transform.scale(
          scale: value,
          child: Opacity(
            opacity: value * 0.6,
            child: Icon(
              icon,
              size: size,
              color: color,
            ),
          ),
        );
      },
    );
  }

  Future<void> _finishOnboarding() async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('seenOnboarding', true);
      
      if (mounted) {
         Navigator.pushReplacement(
            context, 
            MaterialPageRoute(builder: (context) => const LoginScreen())
         );
      }
  }
}
