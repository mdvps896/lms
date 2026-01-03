
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SimpleBarChart = ({ data, title, type = 'category' }) => {
    // Handling two types of data structures
    // 1. Categories: [{_id: "Math", count: 10}, ...]
    // 2. Scores (Bucket): [{_id: 0, count: 5}, {_id: 20, count: 10}...] -> Label "0-20%", "21-40%"

    let categories = [];
    let seriesData = [];

    if (type === 'score') {
        const ranges = {
            0: '0-20%',
            20: '21-40%',
            40: '41-60%',
            60: '61-80%',
            80: '81-100%'
        };
        // Normalize data to ensure all ranges exist (optional, but good for charts)
        const rangeKeys = [0, 20, 40, 60, 80];
        categories = rangeKeys.map(k => ranges[k]);
        seriesData = rangeKeys.map(k => {
            const found = data.find(d => d._id === k);
            return found ? found.count : 0;
        });
    } else {
        categories = data.map(item => item._id);
        seriesData = data.map(item => item.count);
    }

    const chartOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: categories,
            labels: { style: { colors: '#64748b' } }
        },
        yaxis: {
            title: { text: 'Count' },
            labels: { style: { colors: '#64748b' } }
        },
        fill: { opacity: 1 },
        colors: type === 'score' ? ['#10b981'] : ['#3b82f6'], // Green for scores, Blue for categories
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: function (val) {
                    return val
                }
            }
        }
    };

    const series = [{
        name: 'Count',
        data: seriesData
    }];

    return (
        <div className="card h-100 border">
            <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0 text-dark fw-bold">{title}</h5>
            </div>
            <div className="card-body">
                <Chart options={chartOptions} series={series} type="bar" height={320} />
            </div>
        </div>
    );
};

export default SimpleBarChart;
