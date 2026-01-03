
'use client';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import DuplicateLayout from '../duplicateLayout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function AnalyticsPage() {
    return (
        <ProtectedRoute>
            <DuplicateLayout>
                <div className="main-content">
                    <AnalyticsDashboard />
                </div>
            </DuplicateLayout>
        </ProtectedRoute>
    );
}
