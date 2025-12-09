import React from 'react';

const SkeletonLoader = () => {
    return (
        <>
            {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item}>
                    <td>
                        <div className="skeleton-loader" style={{ width: '30px', height: '20px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton-loader" style={{ width: '150px', height: '20px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton-loader" style={{ width: '120px', height: '20px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton-loader" style={{ width: '120px', height: '20px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton-loader" style={{ width: '200px', height: '20px' }}></div>
                    </td>
                    <td>
                        <div className="skeleton-loader" style={{ width: '80px', height: '25px', borderRadius: '20px' }}></div>
                    </td>
                    <td>
                        <div className="d-flex gap-2">
                            <div className="skeleton-loader" style={{ width: '30px', height: '30px', borderRadius: '50%' }}></div>
                            <div className="skeleton-loader" style={{ width: '30px', height: '30px', borderRadius: '50%' }}></div>
                            <div className="skeleton-loader" style={{ width: '30px', height: '30px', borderRadius: '50%' }}></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

export default SkeletonLoader;
