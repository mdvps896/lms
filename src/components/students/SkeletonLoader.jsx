import React from 'react'

const SkeletonLoader = ({ rows = 10 }) => {
    return (
        <>
            {[...Array(rows)].map((_, index) => (
                <tr key={index}>
                    {/* Checkbox */}
                    <td>
                        <div className="skeleton" style={{ width: '20px', height: '20px' }}></div>
                    </td>
                    {/* # */}
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '25px' }}></div>
                    </td>
                    {/* Student Info */}
                    <td>
                        <div className="d-flex align-items-center">
                            <div className="skeleton skeleton-circle me-3" style={{ width: '40px', height: '40px' }}></div>
                            <div>
                                <div className="skeleton skeleton-text mb-1" style={{ width: '100px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '80px', height: '12px' }}></div>
                            </div>
                        </div>
                    </td>
                    {/* Mail */}
                    <td>
                        <div className="skeleton skeleton-text mb-1" style={{ width: '140px' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '100px', height: '12px' }}></div>
                    </td>
                    {/* Courses */}
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                    </td>
                    {/* Date */}
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                    </td>
                    {/* Source/Auth */}
                    <td>
                        <div className="d-flex justify-content-center gap-3">
                            <div className="skeleton skeleton-circle" style={{ width: '18px', height: '18px' }}></div>
                            <div className="skeleton skeleton-circle" style={{ width: '18px', height: '18px' }}></div>
                        </div>
                    </td>
                    {/* Status */}
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '60px', borderRadius: '20px' }}></div>
                    </td>
                    {/* Action */}
                    <td>
                        <div className="d-flex justify-content-end gap-2">
                            <div className="skeleton" style={{ width: '32px', height: '32px' }}></div>
                            <div className="skeleton" style={{ width: '32px', height: '32px' }}></div>
                            <div className="skeleton" style={{ width: '32px', height: '32px' }}></div>
                        </div>
                    </td>
                </tr>
            ))}

            <style jsx>{`
                .skeleton {
                    background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                }
                .skeleton-text {
                    height: 18px;
                }
                .skeleton-circle {
                    border-radius: 50%;
                }
                @keyframes loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
        </>
    )
}

export default SkeletonLoader
