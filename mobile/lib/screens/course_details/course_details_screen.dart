import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart'; // Import here
import 'widgets/course_header.dart';
import 'widgets/course_overview_tab.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../payment_success_screen.dart'; // Import success screen
import 'widgets/course_content_tab.dart';
import '../../models/user_model.dart';
import 'widgets/course_rating_dialog.dart';
import 'widgets/course_reviews_dialog.dart';

class CourseDetailsScreen extends StatefulWidget {
  final Map<String, dynamic>? course;
  final String? courseId; // Optional: if only ID is provided
  final String? applyCouponCode; // Optional: auto-apply coupon

  const CourseDetailsScreen({
    super.key,
    this.course,
    this.courseId,
    this.applyCouponCode,
  });

  @override
  State<CourseDetailsScreen> createState() => _CourseDetailsScreenState();
}

class _CourseDetailsScreenState extends State<CourseDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();
  User? _currentUser;
  final TextEditingController _couponController = TextEditingController(); 
  String? appliedCouponCode;
  double? discountAmount;
  double? finalPrice; 
  double? gstAmount;
  double? totalPayable; 
  bool _isValidatingCoupon = false;
  late Razorpay _razorpay;
  bool _isProcessingPayment = false;
  
  Map<String, dynamic>? _courseData;
  bool _isLoadingDetails = false;
  int _likesCount = 0;
  bool _isLiked = false;
  bool _isRated = false;
  bool _isEnrolled = false;
  bool _isExpired = false;
  final ApiService _apiService = ApiService();
  
  Future<void> _toggleLike() async {
    final id = widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'];
    if (id == null) return;
    
    // Optimistic update
    setState(() {
      _isLiked = !_isLiked;
      _likesCount += _isLiked ? 1 : -1;
    });
    
    final result = await _apiService.toggleLike(id);
    if (result['success'] == true) {
       setState(() {
          _isLiked = result['isLiked'] ?? _isLiked;
          _likesCount = result['likesCount'] ?? _likesCount;
       });
    } else {
       // Revert on failure
       setState(() {
          _isLiked = !_isLiked;
          _likesCount += _isLiked ? 1 : -1;
       });
       if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Error updating like status')));
       }
    }
  }

  void _openRatingDialog() {
     final userRating = _courseData?['userRating'];
     double? initialRating;
     String? initialReview;
     
     if (userRating != null) {
        initialRating = (userRating['rating'] as num?)?.toDouble();
        initialReview = userRating['review']?.toString();
     }

     showDialog(
       context: context,
       builder: (dialogContext) => CourseRatingDialog(
         initialRating: initialRating,
         initialReview: initialReview,
         onSubmit: (rating, review) async {
            print('🌟 Dialog Submit Clicked: $rating, $review');
            final id = widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'];
            
            if (id == null) return;
            
            // Use the stable 'context' (from State) instead of 'dialogContext'
            final scaffoldMessenger = ScaffoldMessenger.of(context);
            scaffoldMessenger.showSnackBar(const SnackBar(content: Text('Submitting rating...')));
            
            final result = await _apiService.rateCourse(id, rating, review);
            
            if (mounted) {
               if (result['success'] == true) {
                   scaffoldMessenger.hideCurrentSnackBar();
                   scaffoldMessenger.showSnackBar(const SnackBar(content: Text('Rating submitted!')));
                   setState(() => _isRated = true);
                   _checkCourseDetails(force: true, silent: true);
               } else if (result['error']?.toString().toLowerCase().contains('already rated') == true || 
                          result['message']?.toString().toLowerCase().contains('already rated') == true) {
                   scaffoldMessenger.showSnackBar(const SnackBar(content: Text('You have already rated this course.')));
                   setState(() => _isRated = true);
               } else {
                   scaffoldMessenger.showSnackBar(SnackBar(content: Text(result['error'] ?? result['message'] ?? 'Failed to submit rating')));
               }
            }
         },
       ),
     );
  }


  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    _couponController.dispose();
    _razorpay.clear();
    super.dispose();
  }
  
  Future<void> _checkCourseDetails({bool force = false, bool silent = false}) async {
     // If we have full data already, skip unless forced
     if (!force && _courseData != null && _courseData!['curriculum'] != null && _courseData!['description'] != null) {
        return;
     }

     final id = widget.courseId ?? widget.course?['_id'] ?? widget.course?['id'];
     if (id == null) return;

     if (!silent) setState(() => _isLoadingDetails = true);
     
     // Get User ID for customized details (likes, ratings)
     final user = await _apiService.getSavedUser();
     final userId = user?.id;
     
     final fullData = await _apiService.getCourseById(id, userId: userId);
     
     if (mounted) {
         setState(() {
             if (fullData != null) {
                // Merge or replace
                _courseData = fullData;
                
                // Update Like & Rate Status
                _likesCount = fullData['likesCount'] ?? 0;
                _isLiked = fullData['isLiked'] ?? false;
                _isRated = fullData['isRated'] ?? false;
             }
             if (!silent) _isLoadingDetails = false;
         });
     }
  }

  Future<void> _checkEnrollment() async {
    try {
      final user = await _apiService.getSavedUser();
      if (user != null) {
         setState(() => _currentUser = user);
         _calculateEnrollmentStatus(user);
      }
    } catch(e) {
      print('Enrollment check error: $e');
    }
  }

  void _calculateEnrollmentStatus(User user) {
     if (user.enrolledCourses == null) return;
     
     bool found = false;
     bool expired = false;
     
     for (var e in user.enrolledCourses!) {
         String id = '';
         DateTime? expiry;
         
         if (e is String) {
            id = e;
         } else if (e is Map) {
            final cIdRaw = e['courseId'] ?? e['course'];
            if (cIdRaw is Map) {
               id = (cIdRaw['_id'] ?? cIdRaw['id'] ?? '').toString();
            } else {
               id = (cIdRaw ?? '').toString();
            }
            
            if (e['expiresAt'] != null) {
                expiry = DateTime.tryParse(e['expiresAt'].toString());
            }
         }
         
         final String targetId = widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'] ?? '';
         
         if (id.isNotEmpty && id == targetId) {
             if (expiry != null && DateTime.now().isAfter(expiry)) {
                 expired = true;
             } else {
                 found = true;
                 expired = false;
                 break;
             }
         }
     }
     
     setState(() {
         _isEnrolled = found;
         _isExpired = expired;
     });
     
     if (found && !expired) {
        // Auto-switch to Content Tab
        Future.delayed(const Duration(milliseconds: 100), () {
           if (mounted) _tabController.animateTo(1);
        });
     }
  }

  void _showReviewsDialog() {
    if (_courseData == null) return;
    final reviews = List<dynamic>.from(_courseData!['reviews'] ?? []);
    showDialog(
      context: context,
      builder: (context) => CourseReviewsDialog(reviews: reviews),
    );
  }

  @override
  void initState() {
    super.initState();
    _courseData = widget.course;
    
    _tabController = TabController(length: 3, vsync: this);


    // Init Razorpay
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    
    _checkCourseDetails();
    _checkEnrollment();

    // Auto-apply coupon if provided
    if (widget.applyCouponCode != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _couponController.text = widget.applyCouponCode!;
        _applyCoupon(widget.applyCouponCode!);
      });
    }
  }

  Future<void> _applyCoupon(String couponCode) async {
    setState(() => _isValidatingCoupon = true);

    try {
      final courseId = widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'];
      if (courseId == null) {
        setState(() => _isValidatingCoupon = false);
        ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('Error: Course ID not found. Please try refreshing.')),
        );
        return;
      }

      final result = await _apiService.validateCoupon(couponCode, courseId);

      setState(() => _isValidatingCoupon = false);

      if (result['success'] == true) {
        final pricing = result['pricing'];
        setState(() {
          appliedCouponCode = couponCode;
          discountAmount = (pricing['discountAmount'] as num).toDouble();
          finalPrice = (pricing['priceAfterDiscount'] as num).toDouble();
          gstAmount = (pricing['gstAmount'] as num).toDouble();
          totalPayable = (pricing['totalPrice'] as num).toDouble();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text('Applied! Saved ₹${discountAmount?.toInt()}')),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Invalid coupon'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() => _isValidatingCoupon = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  bool _isSuccessProcessing = false;

  double _parsePrice(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    String str = value.toString().replaceAll(RegExp(r'[^0-9.]'), '');
    return double.tryParse(str) ?? 0.0;
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (_isSuccessProcessing) return;
    _isSuccessProcessing = true;

    // Verify payment on server
    try {
      if (response.paymentId == null) {
        _isSuccessProcessing = false;
        return;
      }
      
      // Get User ID from ApiService
      final user = await _apiService.getSavedUser();
      if (user == null || user.id == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error: User session invalid. Please login again.')),
        );
        setState(() => _isProcessingPayment = false);
        _isSuccessProcessing = false;
        return;
      }
      final userId = user.id!;

      final amount = totalPayable ?? _parsePrice(_courseData?['price']);

      final verificationData = {
        'razorpay_payment_id': response.paymentId,
        'razorpay_order_id': response.orderId,
        'razorpay_signature': response.signature,
        'courseId': widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'],
        'userId': userId,
        'amount': amount,
      };
      
      ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('Payment successful! Verifying...')),
      );
      
      await _verifyPaymentServer(verificationData);

    } catch (e) {
      print('Payment Success Error: $e');
      setState(() => _isProcessingPayment = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment Error: $e')),
      );
    } finally {
      _isSuccessProcessing = false;
    }
  }

  Future<void> _verifyPaymentServer(Map<String, dynamic> data) async {
     try {
       final result = await _apiService.verifyPayment(data);
       
       // Reset loading
       setState(() => _isProcessingPayment = false);

       if (result['success'] == true) {
          // Refresh User Profile to get updated enrolled courses
          await _apiService.refreshUserProfile();

          // Navigate to Success Screen
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const PaymentSuccessScreen()),
            );
          }
       } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Verification failed: ${result['message']}')),
          );
       }
     } catch (e) {
        setState(() => _isProcessingPayment = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verification network error: $e')),
        );
     }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Payment Failed: ${response.message}')),
    );
    setState(() => _isProcessingPayment = false);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External Wallet: ${response.walletName}')),
    );
  }

  Future<void> _initiatePayment() async {
    print('💰 Buy Now Button Clicked');
    
    if (_isProcessingPayment) {
      print('⚠️ Payment already processing');
      return;
    }
    
    // Check user login first
    final user = await _apiService.getSavedUser();
    if (user == null) {
      print('❌ User not logged in');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to purchase')),
      );
      return;
    }
    
    setState(() => _isProcessingPayment = true);

    try {
      // 1. Calculate Amount
      final amount = totalPayable ?? 
          double.tryParse(_courseData?['totalPrice']?.toString() ?? _courseData?['price']?.toString() ?? '0') ?? 0;
      
      print('💰 Calculated Amount: $amount');
      print('💰 totalPayable: $totalPayable');
      print('💰 courseData totalPrice: ${_courseData?['totalPrice']}');
      print('💰 courseData price: ${_courseData?['price']}');
      
      // 2. Check if price is 0 (100% discount coupon applied)
      if (amount <= 0) {
        print('🎉 Free enrollment - Price is 0');
        
        // Show loading message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                SizedBox(width: 16),
                Text('Enrolling you for free...'),
              ],
            ),
            duration: Duration(seconds: 3),
          ),
        );
        
        // Direct enrollment - call backend API to enroll user
        final courseId = widget.courseId ?? _courseData?['_id'] ?? _courseData?['id'];
        
        // Create a free enrollment verification
        final enrollmentData = {
          'courseId': courseId,
          'userId': user.id,
          'amount': 0,
          'couponCode': appliedCouponCode,
          'isFree': true,
        };
        
        await _verifyPaymentServer(enrollmentData);
        return;
      }

      // 3. For paid courses, proceed with Razorpay
      print('💳 Paid course - Opening Razorpay');
      
      // Create Order on Server
      final orderResult = await _apiService.createOrder(amount, 'INR');
      
      if (orderResult['success'] == true) {
        final keyId = orderResult['keyId'];
        final orderId = orderResult['orderId'];
        
        if (keyId == null || orderId == null) {
           throw Exception('Invalid order credentials from server');
        }

        var options = {
          'key': keyId,
          'amount': orderResult['amount'], 
          'name': 'Duralux Academy',
          'description': _courseData?['title'] ?? 'Course Purchase',
          'order_id': orderId,
          'timeout': 180,
          'prefill': {
            'email': user.email,
          }
        };

        _razorpay.open(options);
      } else {
         ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order creation failed: ${orderResult['message']}')),
        );
        setState(() => _isProcessingPayment = false);
      }

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
         SnackBar(content: Text('Error initiating payment: $e')),
      );
      setState(() => _isProcessingPayment = false);
    }
  }

  void _removeCoupon() {
    setState(() {
      appliedCouponCode = null;
      discountAmount = null;
      finalPrice = null;
      gstAmount = null;
      totalPayable = null;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Coupon removed'),
        backgroundColor: Colors.orange,
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 2),
      ),
    );
  }

  Widget _buildReviewsTab() {
    if (_courseData == null) return const Center(child: Text('No details available'));
    
    final reviews = List<dynamic>.from(_courseData!['reviews'] ?? []);
    
    return Container(
      color: Colors.white,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Rating Summary Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Column(
                  children: [
                    Text(
                      _courseData!['rating']?.toString() ?? '4.5',
                      style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                        Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                        Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                        Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                        Icon(Icons.star_half_rounded, color: Colors.amber, size: 20),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${reviews.length} Ratings',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: Column(
                    children: List.generate(5, (index) {
                      final star = 5 - index;
                      final pct = [0.8, 0.1, 0.05, 0.02, 0.03][index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          children: [
                            Text('$star', style: const TextStyle(fontSize: 12)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: LinearProgressIndicator(
                                  value: pct,
                                  backgroundColor: Colors.grey[200],
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.amber[400]!),
                                  minHeight: 4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          
          // Reviews List
          if (reviews.isEmpty)
             const Padding(
               padding: EdgeInsets.symmetric(vertical: 40),
               child: Center(child: Text('No reviews yet. Be the first to rate!')),
             )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              itemCount: reviews.length,
              separatorBuilder: (context, index) => const SizedBox(height: 24),
              itemBuilder: (context, index) {
                final review = reviews[index];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                          child: Text(
                            (review['userName'] ?? 'U')[0].toUpperCase(),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.primaryColor),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                review['userName'] ?? 'Student',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                review['date'] ?? 'Just now',
                                style: TextStyle(color: Colors.grey[500], fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: List.generate(5, (starIndex) {
                            return Icon(
                              starIndex < (review['rating'] ?? 0) ? Icons.star_rounded : Icons.star_outline_rounded,
                              size: 14,
                              color: Colors.amber,
                            );
                          }),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      review['review'] ?? '',
                      style: TextStyle(color: Colors.grey[700], fontSize: 14, height: 1.4),
                    ),
                  ],
                );
              },
            ),
          
          // Rate Button
          if (_isEnrolled && !_isExpired)
            Padding(
              padding: const EdgeInsets.all(20),
              child: ElevatedButton(
                onPressed: _openRatingDialog,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryColor,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_isRated ? 'Update My Rating' : 'Rate this Course'),
              ),
            ),
            
          const SizedBox(height: 120), // Padding for the fixed button bar
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    // Handle Loading
    if (_isLoadingDetails) {
       return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
       );
    }

    // Handle null course
    if (_courseData == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: const Center(child: Text('Course not found')),
      );
    }
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: NestedScrollView(
          controller: _scrollController,
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              SliverAppBar(
                backgroundColor: Colors.white,
                elevation: 0,
                pinned: true,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, color: Colors.black87),
                  onPressed: () => Navigator.maybePop(context),
                ),
                title: const Text(
                  'Course Details',
                  style: TextStyle(
                    color: Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                centerTitle: true,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.share_rounded, color: Colors.black87),
                    onPressed: () {},
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: CourseHeader(
                  course: _courseData!,
                  likesCount: _likesCount,
                  isLiked: _isLiked,
                  onLikeToggle: _toggleLike,
                  onShowReviews: _showReviewsDialog,
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverAppBarDelegate(
                  TabBar(
                    controller: _tabController,
                    labelColor: AppConstants.primaryColor,
                    unselectedLabelColor: Colors.grey,
                    indicatorColor: AppConstants.primaryColor,
                    indicatorWeight: 3,
                    labelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    tabs: const [
                      Tab(text: 'Overview'),
                      Tab(text: 'Content'),
                      Tab(text: 'Reviews'),
                    ],
                  ),
                ),
              ),
            ];
          },
          body: TabBarView(
            controller: _tabController,
            children: [
              CourseOverviewTab(
                course: _courseData!,
                couponCode: appliedCouponCode,
                discountAmount: discountAmount,
                updatedGstAmount: gstAmount,
                updatedTotalPayable: totalPayable,
                isEnrolled: _isEnrolled && !_isExpired,
                isRated: _isRated,
                onRate: _openRatingDialog,
              ),
              CourseContentTab(
                key: UniqueKey(), // Keeping Key to force rebuild just in case
                course: _courseData!,
                isEnrolled: _isEnrolled && !_isExpired,
              ),
              _buildReviewsTab(),
            ],
          ),
        ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF5F5), // Light red/pink background
          boxShadow: [
             BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Coupon Input Section (Hide if enrolled)
              if (!(_isEnrolled && !_isExpired)) ...[
                  if (appliedCouponCode == null) ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _couponController,
                            decoration: InputDecoration(
                              hintText: 'Enter coupon code',
                              prefixIcon: const Icon(Icons.local_offer, size: 20),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.grey[300]!),
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                            onSubmitted: (value) {
                              if (value.isNotEmpty) _applyCoupon(value);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _isValidatingCoupon ? null : () {
                            if (_couponController.text.isNotEmpty) _applyCoupon(_couponController.text);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.primaryColor,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _isValidatingCoupon 
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ] else ...[
                    // Applied Coupon Display
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green[200]!),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Coupon Applied: $appliedCouponCode', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                                if (discountAmount != null)
                                  Text('You saved ₹${discountAmount!.toStringAsFixed(0)}', style: TextStyle(fontSize: 12, color: Colors.green[700])),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 20),
                            onPressed: _removeCoupon,
                            color: Colors.red,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
              ],
              
              // Price and Action Button
              Row(
                children: [
                  // Price Section (Hide if enrolled)
                  if (!(_isEnrolled && !_isExpired)) ...[
                      Expanded(
                        flex: 2,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (appliedCouponCode != null && discountAmount != null) ...[
                              Text('₹${widget.course?['totalPrice'] ?? widget.course?['price'] ?? '0'}', style: const TextStyle(fontSize: 14, color: Colors.grey, decoration: TextDecoration.lineThrough)),
                              if (gstAmount != null && gstAmount! > 0) Text('+GST ₹${gstAmount?.toStringAsFixed(0)}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                              Text('₹${totalPayable?.toStringAsFixed(0) ?? finalPrice?.toStringAsFixed(0) ?? '0'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFD32F2F))),
                            ] else if (widget.course?['gstEnabled'] == true) ...[
                               Text('₹${widget.course?['price'] ?? '0'}', style: const TextStyle(fontSize: 14, color: Colors.grey, decoration: TextDecoration.lineThrough)),
                               Text('+GST ${widget.course?['gstPercentage'] ?? '0'}%', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                               const SizedBox(height: 2),
                               Text('₹${widget.course?['totalPrice'] ?? widget.course?['price'] ?? '0'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFD32F2F))),
                            ] else ...[
                               const Text('Total Price', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
                               const SizedBox(height: 4),
                               Text('₹${widget.course?['price'] ?? '999'}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFD32F2F))),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                  ],

                  // Action Button (Buy Now or Continue Learning)
                  Expanded(
                    flex: (_isEnrolled && !_isExpired) ? 1 : 3,
                    child: ElevatedButton(
                      onPressed: (_isEnrolled && !_isExpired) 
                          ? () { _tabController.animateTo(1); }
                          : (_isProcessingPayment ? null : _initiatePayment),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: (_isEnrolled && !_isExpired) ? const Color(0xFFD32F2F) : const Color(0xFFFDD835),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isProcessingPayment
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : Text(
                        (_isEnrolled && !_isExpired) ? 'Continue Learning' : 'Buy Now',
                        style: TextStyle(
                          fontSize: 18, 
                          fontWeight: FontWeight.bold,
                          color: (_isEnrolled && !_isExpired) ? Colors.white : Colors.black,
                        ),
                      ),
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
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height + 1; // +1 for border if any
  @override
  double get maxExtent => _tabBar.preferredSize.height + 1;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white, // Sticky background
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end, // Align tab bar to bottom of height
        children: [
          _tabBar,
          Container(height: 1, color: Colors.grey[200]), // Bottom border
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
