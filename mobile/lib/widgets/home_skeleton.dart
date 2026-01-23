import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../utils/constants.dart';

class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Skeleton
              Row(
                children: [
                  _buildShimmerCircle(50),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildShimmerRect(width: 120, height: 20),
                      const SizedBox(height: 6),
                      _buildShimmerRect(width: 180, height: 14),
                    ],
                  ),
                  const Spacer(),
                  _buildShimmerCircle(40),
                ],
              ),
              const SizedBox(height: 24),

              // Search Bar Skeleton
              _buildShimmerRect(
                width: double.infinity,
                height: 50,
                borderRadius: 25,
              ),

              const SizedBox(height: 24),

              // Main Slider
              _buildShimmerRect(
                width: double.infinity,
                height: 200,
                borderRadius: 24,
              ),

              const SizedBox(height: 24),

              // Categories
              _buildShimmerRect(width: 100, height: 20), // Title
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                child: Row(
                  children: List.generate(
                    5,
                    (index) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: _buildShimmerRect(
                        width: 80,
                        height: 36,
                        borderRadius: 20,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Continue Learning
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildShimmerRect(width: 140, height: 20),
                  _buildShimmerRect(width: 60, height: 14),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildShimmerRect(
                      width: double.infinity,
                      height: 160,
                      borderRadius: 20,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildShimmerRect(
                      width: double.infinity,
                      height: 160,
                      borderRadius: 20,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Free Materials
              _buildShimmerRect(width: 120, height: 20),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildShimmerRect(
                      width: double.infinity,
                      height: 140,
                      borderRadius: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildShimmerRect(
                      width: double.infinity,
                      height: 140,
                      borderRadius: 24,
                    ),
                  ),
                ],
              ),
            ],
          ),
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
