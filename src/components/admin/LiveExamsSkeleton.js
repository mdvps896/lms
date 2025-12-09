export default function LiveExamsSkeleton() {
    return (
        <div className="container-fluid p-4">
            {/* Header Skeleton */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="placeholder-glow">
                    <span className="placeholder col-12" style={{ width: '300px', height: '32px', display: 'block' }}></span>
                </div>
                <div className="placeholder-glow">
                    <span className="placeholder col-12" style={{ width: '150px', height: '30px', borderRadius: '20px' }}></span>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-4 placeholder-glow">
                <div className="d-flex gap-2">
                    <span className="placeholder" style={{ width: '120px', height: '40px', borderRadius: '4px' }}></span>
                    <span className="placeholder" style={{ width: '120px', height: '40px', borderRadius: '4px' }}></span>
                    <span className="placeholder" style={{ width: '120px', height: '40px', borderRadius: '4px' }}></span>
                </div>
            </div>

            {/* Card Skeleton */}
            <div className="card">
                <div className="card-header placeholder-glow">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="placeholder col-3" style={{ height: '24px' }}></span>
                        <span className="placeholder col-2" style={{ height: '24px', borderRadius: '12px' }}></span>
                    </div>
                </div>
                <div className="card-body">
                    {/* Student Cards Grid Skeleton */}
                    <div className="row g-3">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="col-md-6 col-lg-4 col-xl-3">
                                <div className="card h-100 border">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="placeholder-glow">
                                                <span
                                                    className="placeholder rounded-circle"
                                                    style={{ width: '50px', height: '50px', display: 'block' }}
                                                ></span>
                                            </div>
                                            <div className="ms-3 flex-grow-1 placeholder-glow">
                                                <span className="placeholder col-8 mb-2" style={{ height: '16px', display: 'block' }}></span>
                                                <span className="placeholder col-5" style={{ height: '12px', display: 'block' }}></span>
                                            </div>
                                        </div>

                                        <div className="mb-3 placeholder-glow">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="placeholder col-5" style={{ height: '12px' }}></span>
                                                <span className="placeholder col-3" style={{ height: '12px' }}></span>
                                            </div>
                                            <span className="placeholder col-12" style={{ height: '5px', display: 'block' }}></span>
                                        </div>

                                        <div className="d-grid placeholder-glow">
                                            <span className="placeholder col-12" style={{ height: '32px', borderRadius: '4px' }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
