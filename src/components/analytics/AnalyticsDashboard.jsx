
'use client';
import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaBookOpen, FaFileAlt, FaChartLine, FaSpinner, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import StatsCard from './StatsCard';
import ActivityChart from './ActivityChart';
import StatusChart from './StatusChart';
import RecentTables from './RecentTables';
import SimpleBarChart from './SimpleBarChart';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        chartData: { activity: [], status: [], devices: [], categories: [], scores: [] },
        counts: { users: 0, courses: 0, materials: 0, activeExams: 0 },
        recentActivity: [],
        recentMaterials: []
    });

    // Default to last 30 days
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            });

            const res = await fetch(`/api/analytics?${queryParams}`);
            const json = await res.json();

            if (json.success) {
                setStats(json.data);
            } else {
                toast.error('Failed to load analytics data');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilter = () => {
        fetchData();
    };

    if (loading && !stats.counts.users) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0">
            {/* Page Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Dashboard Overview</h4>
                    <p className="text-muted mb-0">Welcome to your analytics dashboard.</p>
                </div>

                {/* Date Filter & Button */}
                <div className="d-flex align-items-center bg-white border rounded px-2 py-1 mt-3 mt-md-0 shadow-sm">
                    <FaCalendarAlt className="text-muted mx-2" />
                    <DatePicker
                        selected={dateRange.startDate}
                        onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                        selectsStart
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        className="form-control border-0 p-1 bg-transparent fw-semibold"
                        style={{ width: '105px', fontSize: '0.9rem' }}
                        dateFormat="MMM d, yyyy"
                    />
                    <span className="mx-1 text-muted">-</span>
                    <DatePicker
                        selected={dateRange.endDate}
                        onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                        selectsEnd
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        minDate={dateRange.startDate}
                        className="form-control border-0 p-1 bg-transparent fw-semibold"
                        style={{ width: '105px', fontSize: '0.9rem' }}
                        dateFormat="MMM d, yyyy"
                    />
                    <div className="border-start mx-2" style={{ height: '24px' }}></div>
                    <button
                        className="btn btn-sm btn-primary d-flex align-items-center px-3"
                        onClick={handleFilter}
                    >
                        <FaFilter className="me-2" size={12} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <StatsCard
                        title="Total Users"
                        value={stats.counts.users}
                        icon={<FaUserFriends size={24} />}
                        color="primary"
                        trend="up" trendValue={12}
                    />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <StatsCard
                        title="Active Exams"
                        value={stats.counts.activeExams}
                        icon={<FaChartLine size={24} />}
                        color="success"
                        trend="up" trendValue={5}
                    />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <StatsCard
                        title="Courses"
                        value={stats.counts.courses}
                        icon={<FaBookOpen size={24} />}
                        color="warning"
                    />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <StatsCard
                        title="Materials"
                        value={stats.counts.materials}
                        icon={<FaFileAlt size={24} />}
                        color="info"
                    />
                </div>
            </div>

            {/* Main Charts */}
            <div className="row g-3 mb-4">
                <div className="col-lg-8">
                    <ActivityChart data={stats.chartData.activity} />
                </div>
                <div className="col-lg-4">
                    <StatusChart data={stats.chartData.status} />
                </div>
            </div>

            {/* New Bar Charts Row */}
            <div className="row g-3 mb-4">
                <div className="col-lg-6">
                    <SimpleBarChart
                        title="Attempts by Category"
                        data={stats.chartData.categories || []}
                        type="category"
                    />
                </div>
                <div className="col-lg-6">
                    <SimpleBarChart
                        title="Score Distribution"
                        data={stats.chartData.scores || []}
                        type="score"
                    />
                </div>
            </div>

            {/* Additional Analytics Row */}
            <div className="row g-3 mb-4">
                <div className="col-lg-6">
                    <SimpleBarChart
                        title="PDF View Analytics"
                        data={stats.chartData.pdfViews || []}
                        type="pdf"
                    />
                </div>
                <div className="col-lg-6">
                    <SimpleBarChart
                        title="Course Sales Analytics"
                        data={stats.chartData.courseSales || []}
                        type="course"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="row">
                <div className="col-12">
                    <RecentTables
                        attempts={stats.recentActivity}
                        materials={stats.recentMaterials}
                        pdfViews={stats.recentPDFViews}
                        payments={stats.recentPayments}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
