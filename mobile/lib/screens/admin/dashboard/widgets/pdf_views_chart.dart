import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class PdfViewsChart extends StatelessWidget {
  const PdfViewsChart({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 100,
          barTouchData: BarTouchData(enabled: true),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  if (value.toInt() >= 0 && value.toInt() < days.length) {
                    return Text(
                      days[value.toInt()],
                      style: const TextStyle(fontSize: 12),
                    );
                  }
                  return const Text('');
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 40,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString(),
                    style: const TextStyle(fontSize: 12),
                  );
                },
              ),
            ),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 20,
          ),
          borderData: FlBorderData(show: false),
          barGroups: [
            BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 45, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 65, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 52, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 78, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 88, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 5, barRods: [BarChartRodData(toY: 42, color: Colors.blue, width: 16)]),
            BarChartGroupData(x: 6, barRods: [BarChartRodData(toY: 38, color: Colors.blue, width: 16)]),
          ],
        ),
      ),
    );
  }
}
