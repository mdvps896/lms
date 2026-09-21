'use client';
import { FiClock, FiHelpCircle } from 'react-icons/fi';

// Banner shown to students while their result is still awaiting manual
// evaluation of subjective questions. Extracted verbatim from page.js.
const DraftStatusBanner = () => {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <div className="alert alert-warning border-0 shadow-sm" style={{ backgroundColor: '#fff3cd', borderLeft: '5px solid #ffc107' }}>
                    <div className="d-flex align-items-start">
                        <div className="me-3" style={{ fontSize: '3rem', color: '#ff9800' }}>
                            <FiClock />
                        </div>
                        <div className="flex-grow-1">
                            <h4 className="alert-heading mb-3" style={{ color: '#856404', fontWeight: 600 }}>
                                <FiHelpCircle className="me-2" size={24} />
                                Result is Coming - Under Checking
                            </h4>
                            <p className="mb-2" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                Your exam contains <strong>subjective questions</strong> (Short Answer / Long Answer) that require manual evaluation by the teacher.
                            </p>
                            <p className="mb-2" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                📋 <strong>Current Status:</strong> Under Review by Teacher
                            </p>
                            <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                                🔔 You will be <strong>notified</strong> once the evaluation is complete and your final result is published.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraftStatusBanner;
