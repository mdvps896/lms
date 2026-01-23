import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';

class AuthHeaderCarousel extends StatefulWidget {
  const AuthHeaderCarousel({super.key});

  @override
  State<AuthHeaderCarousel> createState() => _AuthHeaderCarouselState();
}

class _AuthHeaderCarouselState extends State<AuthHeaderCarousel> {
  int _current = 0;
  final CarouselSliderController _controller = CarouselSliderController();

  final List<Map<String, dynamic>> _slides = [
    {
      'icon': Icons.chat_bubble_outline_rounded,
      'color': Colors.orangeAccent,
      'title': "It's all about\ncommunication",
      'subtitle': "Stay connected 24x7 directly using our\nchat feature"
    },
    {
      'icon': Icons.folder_open_rounded,
      'color': Colors.blueAccent,
      'title': "Structured Content",
      'subtitle': "Access study material that is structured\nand easy to find"
    },
    {
      'icon': Icons.play_circle_outline_rounded,
      'color': Colors.redAccent,
      'title': "Learn Anywhere",
      'subtitle': "Watch videos and learn at your own pace\nfrom anywhere"
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 20),
        CarouselSlider(
          items: _slides.map((slide) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon/Illustration placeholder
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Decorative bubbles/icons could go here
                     Icon(
                      slide['icon'],
                      size: 60,
                      color: slide['color'],
                    ),
                    Positioned(
                       top: 0,
                       right: 0,
                       child: Icon(Icons.favorite, size: 20, color: Colors.amber),
                    ) // Just mimicking the colorful illustration vibe
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  slide['title'],
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  slide['subtitle'],
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                    height: 1.4,
                  ),
                ),
              ],
            );
          }).toList(),
          carouselController: _controller,
          options: CarouselOptions(
              height: 250,
              autoPlay: true,
              viewportFraction: 1.0,
              onPageChanged: (index, reason) {
                setState(() {
                  _current = index;
                });
              }),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _slides.asMap().entries.map((entry) {
            return GestureDetector(
              onTap: () => _controller.animateToPage(entry.key),
              child: Container(
                width: 8.0,
                height: 8.0,
                margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: (Theme.of(context).brightness == Brightness.dark
                            ? Colors.white
                            : Colors.blue)
                        .withOpacity(_current == entry.key ? 0.9 : 0.2)),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
