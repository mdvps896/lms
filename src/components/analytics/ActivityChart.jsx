
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ActivityChart = ({ data }) => {
    // Expect data format: [{ _id: "2023-10-01", count: 10 }]
    const categories = data.map(item => item._id);
    const seriesData = data.map(item => item.count);

    const chartOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Inter, sans-serif'
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#6366f1'], // Indigo
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        xaxis: {
            categories: categories,
            labels: { style: { colors: '#64748b' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: '#64748b' } }
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
        },
        tooltip: {
            theme: 'light'
        }
    };

    const series = [{
        name: 'Exams Started',
        data: seriesData
    }];

    return (
        <div className="card h-100 border">
            <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0 text-dark fw-bold">Exam Activity</h5>
            </div>
            <div className="card-body">
                <Chart options={chartOptions} series={series} type="area" height={320} />
            </div>
        </div>
    );
};

export default ActivityChart;
