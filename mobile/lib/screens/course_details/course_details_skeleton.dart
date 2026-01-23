import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class CourseDetailsSkeleton extends StatelessWidget {
  const CourseDetailsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const Icon(Icons.arrow_back_rounded, color: Colors.grey),
        centerTitle: true,
        title: _buildShimmerRect(width: 100, height: 20),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Image
            _buildShimmerRect(
              width: double.infinity,
              height: 220,
              borderRadius: 0,
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  _buildShimmerRect(width: 250, height: 28),
                  const SizedBox(height: 8),
                  _buildShimmerRect(width: 150, height: 28),
                  const SizedBox(height: 16),

                  // Instructor Row
                  Row(
                    children: [
                      _buildShimmerCircle(40),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildShimmerRect(width: 100, height: 16),
                          const SizedBox(height: 4),
                          _buildShimmerRect(width: 140, height: 12),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Action Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: _buildShimmerRect(
                      width: double.infinity,
                      height: 56,
                      borderRadius: 16,
                    ),
                  ),
                  const SizedBox(width: 16),
                  _buildShimmerRect(width: 50, height: 50, borderRadius: 16),
                  const SizedBox(width: 12),
                  _buildShimmerRect(width: 50, height: 50, borderRadius: 16),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Stats
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildShimmerRect(width: 80, height: 20),
                  _buildShimmerRect(width: 80, height: 20),
                  _buildShimmerRect(width: 80, height: 20),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // Progress/Curriculum
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildShimmerRect(width: 120, height: 20), // "Course Content"
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildShimmerRect(width: 150, height: 16),
                            _buildShimmerRect(width: 60, height: 12),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: List.generate(
                              3,
                              (index) => Row(
                                children: [
                                  _buildShimmerCircle(24),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      _buildShimmerRect(width: 180, height: 14),
                                      const SizedBox(height: 4),
                                      _buildShimmerRect(width: 50, height: 10),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerRect({
    required double width,
    required double height,
    double borderRadius = 8,
  }) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  Widget _buildShimmerCircle(double size) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
