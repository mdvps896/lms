
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const StatusChart = ({ data }) => {
    // Expect data format: [{ _id: "active", count: 5 }, { _id: "submitted", count: 10 }]
    const labels = data.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1));
    const seriesData = data.map(item => item.count);

    // Simple colors
    const getColor = (status) => {
        const s = status.toLowerCase();
        if (s === 'submitted') return '#10b981'; // Success Green
        if (s === 'active') return '#3b82f6'; // Primary Blue
        if (s === 'expired') return '#ef4444'; // Danger Red
        return '#6b7280'; // Gray
    };

    const colors = data.map(item => getColor(item._id));

    const chartOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'Inter, sans-serif'
        },
        labels: labels,
        colors: colors.length > 0 ? colors : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#64748b'
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: {
            position: 'bottom',
        },
        stroke: { show: false }
    };

    return (
        <div className="card h-100 border">
            <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0 text-dark fw-bold">Status Overview</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
                <Chart options={chartOptions} series={seriesData} type="donut" height={320} width={"100%"} />
            </div>
        </div>
    );
};

export default StatusChart;
