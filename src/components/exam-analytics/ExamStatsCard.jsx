'use client'

export default function ExamStatsCard({ title, value, icon, bgColor }) {
    return (
        <div className={`card bg-${bgColor} text-white`}>
            <div className="card-body text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                    <i className={`${icon} fa-2x`}></i>
                </div>
                <h3 className="mb-1">{value}</h3>
                <h6 className="mb-0 opacity-75">{title}</h6>
            </div>
        </div>
    );
}