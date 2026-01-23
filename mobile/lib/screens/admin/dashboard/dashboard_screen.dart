import 'package:flutter/material.dart';
import '../../../utils/constants.dart';
import '../shared/skeleton_loader.dart';
import '../shared/admin_widgets.dart';
import '../../../services/pdf_chart_service.dart';
import 'widgets/stats_card.dart';
import 'widgets/revenue_chart.dart';
import 'widgets/pdf_views_chart.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedPeriod = 'Weekly';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    // Simulate API call
    await Future.delayed(const Duration(milliseconds: 1500));
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _isLoading = true;
        });
        await _loadData();
      },
      color: Colors.blue,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Cards Row 1
          if (_isLoading)
            Row(
              children: const [
                Expanded(child: StatCardSkeleton()),
                SizedBox(width: 12),
                Expanded(child: StatCardSkeleton()),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.people_rounded,
                    title: 'Total Students',
                    value: '1,245',
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.book_rounded,
                    title: 'Total Courses',
                    value: '48',
                    color: Colors.purple,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),
          // Stats Cards Row 2
          if (_isLoading)
            Row(
              children: const [
                Expanded(child: StatCardSkeleton()),
                SizedBox(width: 12),
                Expanded(child: StatCardSkeleton()),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.quiz_rounded,
                    title: 'Total Questions',
                    value: '2,850',
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.library_books_rounded,
                    title: 'Free Materials',
                    value: '156',
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),
          // Stats Cards Row 3
          if (_isLoading)
            Row(
              children: const [
                Expanded(child: StatCardSkeleton()),
                SizedBox(width: 12),
                Expanded(child: StatCardSkeleton()),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.video_call_rounded,
                    title: 'Google Meet',
                    value: '24',
                    color: Colors.red,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    icon: Icons.local_offer_rounded,
                    title: 'Total Coupons',
                    value: '18',
                    color: Colors.pink,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 16),
          // Export PDF Button
          ActionButton(
            icon: Icons.picture_as_pdf,
            label: 'Export Dashboard PDF',
            color: Colors.red,
            onTap: () async {
              await PdfChartGenerator.generateDashboardPdf(
                context: context,
                dashboardData: {
                  'students': '1,245',
                  'courses': '48',
                  'questions': '2,850',
                  'materials': '156',
                  'meetings': '24',
                  'coupons': '18',
                },
              );
            },
          ),
          const SizedBox(height: 16),
          // Info Cards Row
          Row(
            children: [
              Expanded(
                child: InfoCard(
                  icon: Icons.trending_up,
                  label: 'Monthly Growth',
                  value: '+12.5%',
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: InfoCard(
                  icon: Icons.attach_money,
                  label: 'Total Revenue',
                  value: '\$45,230',
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Revenue Chart
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Revenue',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        _buildPeriodButton('Monthly'),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Weekly'),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Today'),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const RevenueChart(),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // PDF Views Chart
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'PDF Views',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'This Week',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const PdfViewsChart(),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildPeriodButton(String period) {
    final isSelected = _selectedPeriod == period;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedPeriod = period;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black87 : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          period,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black54,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.black54,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
