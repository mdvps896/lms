import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../screens/course_details/course_details_screen.dart';

class CouponSlider extends StatefulWidget {
  final List<Map<String, dynamic>> coupons;

  const CouponSlider({super.key, required this.coupons});

  @override
  State<CouponSlider> createState() => _CouponSliderState();
}

class _CouponSliderState extends State<CouponSlider> {
  final PageController _pageController = PageController(viewportFraction: 0.9);

  void _copyCouponCode(BuildContext context, String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text('Code "$code" copied!', style: const TextStyle(fontSize: 12)),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 2),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _navigateToCourse(BuildContext context, Map<String, dynamic> coupon) {
    if (coupon['applicationType'] == 'specific' &&
        coupon['courses'] != null &&
        (coupon['courses'] as List).isNotEmpty) {
      final course = (coupon['courses'] as List).first;
      final courseId = course['_id'] ?? course['id'];

      if (courseId != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => CourseDetailsScreen(
                  courseId: courseId,
                  course: course,
                  applyCouponCode: coupon['code'],
                ),
          ),
        );
      } else {
        _copyCouponCode(context, coupon['code']);
      }
    } else {
      _copyCouponCode(context, coupon['code']);
    }
  }

  // Generate color based on coupon type and index
  Color _getBgColor(Map<String, dynamic> coupon, int index) {
    final type = coupon['applicationType'] ?? 'all';

    if (type == 'specific') {
      // Course specific - Cool Blues/Purples
      return index % 2 == 0 ? const Color(0xFFE3F2FD) : const Color(0xFFEDE7F6);
    } else if (type == 'category') {
      // Category - Warm Oranges/Pinks
      return index % 2 == 0 ? const Color(0xFFFFF3E0) : const Color(0xFFFCE4EC);
    } else {
      // All/General - Greens/Golds
      return index % 2 == 0 ? const Color(0xFFE8F5E9) : const Color(0xFFFFF8E1);
    }
  }

  Color _getTextColor(Map<String, dynamic> coupon, int index) {
    final type = coupon['applicationType'] ?? 'all';
    if (type == 'specific') {
      return index % 2 == 0 ? const Color(0xFF1565C0) : const Color(0xFF512DA8);
    } else if (type == 'category') {
      return index % 2 == 0 ? const Color(0xFFEF6C00) : const Color(0xFFC2185B);
    } else {
      return index % 2 == 0 ? const Color(0xFF2E7D32) : const Color(0xFFF57F17);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.coupons.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 70, // Slightly taller to accommodate wider layout
      child: PageView.builder(
        controller: _pageController,
        itemCount: widget.coupons.length,
        padEnds:
            false, // Start from left, but because viewport < 1, it centers roughly optionally
        // We want hints. PageView with viewportFraction gives hints automatically.
        itemBuilder: (context, index) {
          final coupon = widget.coupons[index];
          final bgColor = _getBgColor(coupon, index);
          final textColor = _getTextColor(coupon, index);

          // Margin to create gap between pages
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 6),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  if (coupon['applicationType'] == 'specific') {
                    _navigateToCourse(context, coupon);
                  } else {
                    _copyCouponCode(context, coupon['code']);
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: textColor.withValues(alpha: 0.15),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: textColor.withValues(alpha: 0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // 1. Icon Badge (Left)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: textColor.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.percent_rounded,
                          color: textColor,
                          size: 20,
                        ),
                      ),

                      const SizedBox(width: 12),

                      // 2. Info (Middle)
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${coupon['discountValue']}${coupon['discountType'] == 'percentage' ? '%' : '₹'} OFF',
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              coupon['applicationType'] == 'specific'
                                  ? 'On Specific Course'
                                  : coupon['applicationType'] == 'category'
                                  ? 'On Category'
                                  : 'On All Courses',
                              style: TextStyle(
                                color: textColor.withValues(alpha: 0.8),
                                fontSize: 11,
                                overflow: TextOverflow.ellipsis,
                              ),
                              maxLines: 1,
                            ),
                          ],
                        ),
                      ),

                      // 3. Code & Action (Right)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(
                            20,
                          ), // Pill shape for code
                          border: Border.all(
                            color: textColor.withValues(alpha: 0.3),
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(
                              coupon['code'],
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(
                              coupon['applicationType'] == 'specific'
                                  ? Icons.arrow_forward_rounded
                                  : Icons.copy_rounded,
                              size: 14,
                              color: textColor,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
