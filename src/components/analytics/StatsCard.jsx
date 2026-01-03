
import React from 'react';

const StatsCard = ({ title, value, icon, trend, trendValue, color }) => {
    return (
        <div className="card h-100 border-start border-4 mb-3" style={{ borderColor: `var(--bs-${color})` }}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="card-subtitle text-muted text-uppercase mb-0 small">{title}</h6>
                    <div className={`text-${color}`}>
                        {icon}
                    </div>
                </div>
                <h2 className="card-title fw-bold text-dark mb-2">{value}</h2>
                {trend && (
                    <div className="text-muted small">
                        <span className={`text-${trend === 'up' ? 'success' : 'danger'} fw-bold me-1`}>
                            {trend === 'up' ? '↑' : '↓'} {trendValue}%
                        </span>
                        <span className="ms-1">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
