import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'widgets/order_list_item.dart';

class OrdersAnalyticsScreen extends StatefulWidget {
  const OrdersAnalyticsScreen({super.key});

  @override
  State<OrdersAnalyticsScreen> createState() => _OrdersAnalyticsScreenState();
}

class _OrdersAnalyticsScreenState extends State<OrdersAnalyticsScreen> {
  String _chartPeriod = 'Weekly';
  String _listPeriod = 'Weekly';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Orders Chart
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
                      'Orders',
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
                SizedBox(
                  height: 200,
                  child: BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: 60,
                      barTouchData: BarTouchData(enabled: false),
                      titlesData: FlTitlesData(
                        show: true,
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (double value, TitleMeta meta) {
                              const style = TextStyle(
                                color: Colors.black54,
                                fontWeight: FontWeight.w500,
                                fontSize: 12,
                              );
                              String text;
                              switch (value.toInt()) {
                                case 0:
                                  text = 'Aug 19';
                                  break;
                                case 1:
                                  text = 'Aug 20';
                                  break;
                                case 2:
                                  text = 'Aug 21';
                                  break;
                                case 3:
                                  text = 'Aug 22';
                                  break;
                                default:
                                  text = '';
                                  break;
                              }
                              return SideTitleWidget(
                                axisSide: meta.axisSide,
                                child: Text(text, style: style),
                              );
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            interval: 10,
                            reservedSize: 35,
                            getTitlesWidget: (double value, TitleMeta meta) {
                              const style = TextStyle(
                                color: Colors.black54,
                                fontWeight: FontWeight.w500,
                                fontSize: 12,
                              );
                              return Text(value.toInt().toString(), style: style);
                            },
                          ),
                        ),
                      ),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: 10,
                        getDrawingHorizontalLine: (value) {
                          return FlLine(
                            color: Colors.grey[200]!,
                            strokeWidth: 1,
                          );
                        },
                      ),
                      borderData: FlBorderData(show: false),
                      barGroups: [
                        BarChartGroupData(
                          x: 0,
                          barRods: [
                            BarChartRodData(
                              toY: 50,
                              color: Colors.black87,
                              width: 16,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        ),
                        BarChartGroupData(
                          x: 1,
                          barRods: [
                            BarChartRodData(
                              toY: 20,
                              color: Colors.black87,
                              width: 16,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        ),
                        BarChartGroupData(
                          x: 2,
                          barRods: [
                            BarChartRodData(
                              toY: 35,
                              color: Colors.pink[300]!,
                              width: 16,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        ),
                        BarChartGroupData(
                          x: 3,
                          barRods: [
                            BarChartRodData(
                              toY: 45,
                              color: Colors.pink[300]!,
                              width: 16,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Order List
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
                      'Order List',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        _buildPeriodButton('Monthly', _listPeriod, (period) {
                          setState(() => _listPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Weekly', _listPeriod, (period) {
                          setState(() => _listPeriod = period);
                        }),
                        const SizedBox(width: 8),
                        _buildPeriodButton('Today', _listPeriod, (period) {
                          setState(() => _listPeriod = period);
                        }),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const OrderListItem(
                  initials: 'JS',
                  name: 'John Smith',
                  date: 'Aug 21, 2024',
                  amount: '+\$10.00',
                  isNew: true,
                ),
                const SizedBox(height: 12),
                const OrderListItem(
                  initials: 'AJ',
                  name: 'Adam James',
                  date: 'Aug 21, 2024',
                  amount: '+\$8.50',
                  isNew: true,
                ),
                const SizedBox(height: 12),
                const OrderListItem(
                  initials: 'CD',
                  name: 'Clara David',
                  date: 'Aug 20, 2024',
                  amount: '+\$14.00',
                  isNew: true,
                ),
                const SizedBox(height: 12),
                const OrderListItem(
                  initials: 'EJ',
                  name: 'Emily John',
                  date: 'Aug 19, 2024',
                  amount: '+\$12.30',
                  isNew: true,
                ),
              ],
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
