import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'widgets/analytics_chart.dart';
import 'widgets/trending_items_card.dart';

class AnalyticsDashboardScreen extends StatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  State<AnalyticsDashboardScreen> createState() => _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends State<AnalyticsDashboardScreen> {
  String _chartPeriod = 'Weekly';
  String _trendingPeriod = 'Weekly';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sales Stats
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  icon: Icons.trending_up,
                  value: '35K',
                  label: 'Total Sales',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  icon: Icons.show_chart,
                  value: '2,153',
                  label: 'Average Sales',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Chart Orders
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
                      'Chart Orders',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        _buildPeriodButton('Monthly', _chartPeriod, (period) {
                          setState(() => _chartPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Weekly', _chartPeriod, (period) {
                          setState(() => _chartPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Today', _chartPeriod, (period) {
                          setState(() => _chartPeriod = period);
                        }),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const AnalyticsChart(),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Trending Items
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
                      'Trending Items',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        _buildPeriodButton('Monthly', _trendingPeriod, (period) {
                          setState(() => _trendingPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Weekly', _trendingPeriod, (period) {
                          setState(() => _trendingPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Today', _trendingPeriod, (period) {
                          setState(() => _trendingPeriod = period);
                        }),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const TrendingItemsCard(
                  name: 'Airdopes',
                  brand: 'boAt',
                  sales: 383,
                  salesChange: 12,
                  isPositive: true,
                ),
                const SizedBox(height: 12),
                const TrendingItemsCard(
                  name: 'DSLR Camera',
                  brand: 'Nikon',
                  sales: 144,
                  salesChange: 5,
                  isPositive: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Container(
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
          Icon(icon, size: 32, color: Colors.black87),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodButton(String period, String currentPeriod, Function(String) onTap) {
    final isSelected = currentPeriod == period;
    return InkWell(
      onTap: () => onTap(period),
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
}
