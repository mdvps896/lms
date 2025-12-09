import React from 'react'

const SkeletonLoader = ({ rows = 10 }) => {
    return (
        <>
            {[...Array(rows)].map((_, index) => (
                <tr key={index}>
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '30px' }}></div>
                    </td>
                    <td>
                        <div className="d-flex align-items-center">
                            <div className="skeleton skeleton-circle me-2" style={{ width: '40px', height: '40px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                        </div>
                    </td>
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                    </td>
                    <td>
                        <div className="d-flex gap-1">
                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '30px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '30px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '30px' }}></div>
                        </div>
                    </td>
                </tr>
            ))}

            <style jsx>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                }
                .skeleton-text {
                    height: 20px;
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
