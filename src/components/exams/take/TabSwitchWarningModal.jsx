import React, { useEffect, useState } from 'react';

export default function TabSwitchWarningModal({ show, onClose, remainingAttempts, totalAttempts }) {
    const [secondsLeft, setSecondsLeft] = useState(5);

    useEffect(() => {
        if (!show) {
            setSecondsLeft(5);
            return;
        }

        // Reset timer when modal shows
        setSecondsLeft(5);

        // Countdown timer
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTimeout(() => onClose(), 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [show, onClose]);

    if (!show) return null;

    const progressPercent = (secondsLeft / 5) * 100;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-danger text-white border-0 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body text-center px-5 pb-5 pt-2">
                        <div className="mb-4">
                            <i className="feather-alert-octagon" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h3 className="fw-bold mb-3">WARNING!</h3>
                        <p className="fs-5 mb-4">
                            Tab switching is strictly prohibited.
                        </p>
                        <div className="p-3 bg-white bg-opacity-10 rounded mb-4">
                            <h5 className="mb-1">Attempts Remaining: <strong>{remainingAttempts}</strong> / {totalAttempts}</h5>
                            <small className="d-block mt-2">If you exceed the limit, your exam will be automatically submitted.</small>
                        </div>

                        <div className="progress mb-3 bg-white bg-opacity-25" style={{ height: '8px' }}>
                            <div
                                className="progress-bar bg-white"
                                style={{
                                    width: `${progressPercent}%`,
                                    transition: 'width 1s linear'
                                }}
                            ></div>
                        </div>
                        <small className="text-white-50 fw-bold" style={{ fontSize: '1rem' }}>
                            Auto-closing in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}
