import React, { useEffect, useState } from 'react';

export default function ScreenshotWarningModal({ show, onClose }) {
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
                <div className="modal-content bg-warning text-dark border-0 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body text-center px-5 pb-5 pt-2">
                        <div className="mb-4">
                            <i className="feather-camera-off" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h3 className="fw-bold mb-3">SCREENSHOT DETECTED!</h3>
                        <p className="fs-5 mb-4">
                            Taking screenshots during the exam is strictly prohibited.
                        </p>
                        <div className="p-3 bg-dark bg-opacity-10 rounded mb-4">
                            <p className="mb-0">This activity has been logged. Repeated attempts may result in exam termination.</p>
                        </div>

                        <div className="progress mb-3 bg-dark bg-opacity-25" style={{ height: '8px' }}>
                            <div
                                className="progress-bar bg-dark"
                                style={{
                                    width: `${progressPercent}%`,
                                    transition: 'width 1s linear'
                                }}
                            ></div>
                        </div>
                        <small className="text-dark fw-bold" style={{ fontSize: '1rem', opacity: 0.75 }}>
                            Auto-closing in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}
