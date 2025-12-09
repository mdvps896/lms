import React from 'react';

const ExamSkeleton = ({ viewMode }) => {
    if (viewMode === 'list') {
        return (
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <th key={i}><div className="placeholder-glow"><span className="placeholder col-6"></span></div></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(j => <td key={j}><div className="placeholder-glow"><span className="placeholder col-10"></span></div></td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="row">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100" aria-hidden="true">
                        <div className="card-header">
                            <h5 className="card-title placeholder-glow">
                                <span className="placeholder col-6"></span>
                            </h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-7"></span>
                                <span className="placeholder col-4"></span>
                                <span className="placeholder col-4"></span>
                                <span className="placeholder col-6"></span>
                                <span className="placeholder col-8"></span>
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExamSkeleton;
