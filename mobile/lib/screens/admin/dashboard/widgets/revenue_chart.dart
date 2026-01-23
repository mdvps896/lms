import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class RevenueChart extends StatelessWidget {
  const RevenueChart({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: LineChart(
        LineChartData(
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
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (double value, TitleMeta meta) {
                  const style = TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  );
                  String text;
                  switch (value.toInt()) {
                    case 0:
                      text = 'S';
                      break;
                    case 1:
                      text = 'M';
                      break;
                    case 2:
                      text = 'T';
                      break;
                    case 3:
                      text = 'W';
                      break;
                    case 4:
                      text = 'T';
                      break;
                    case 5:
                      text = 'F';
                      break;
                    case 6:
                      text = 'S';
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
          borderData: FlBorderData(show: false),
          minX: 0,
          maxX: 6,
          minY: 0,
          maxY: 60,
          lineBarsData: [
            // Pink line
            LineChartBarData(
              spots: const [
                FlSpot(0, 40),
                FlSpot(1, 30),
                FlSpot(2, 50),
                FlSpot(3, 35),
                FlSpot(4, 55),
                FlSpot(5, 40),
                FlSpot(6, 45),
              ],
              isCurved: true,
              color: Colors.pink[300],
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(show: false),
            ),
            // Black line
            LineChartBarData(
              spots: const [
                FlSpot(0, 35),
                FlSpot(1, 45),
                FlSpot(2, 25),
                FlSpot(3, 40),
                FlSpot(4, 30),
                FlSpot(5, 50),
                FlSpot(6, 35),
              ],
              isCurved: true,
              color: Colors.black87,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(show: false),
            ),
          ],
        ),
      ),
    );
  }
}
