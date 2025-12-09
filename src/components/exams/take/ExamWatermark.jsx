'use client';
import React from 'react';

export default function ExamWatermark({
    userName,
    settings = {}
}) {
    const {
        enabled = true,
        text = '',
        quantity = 20,
        fontSize = 24
    } = settings;

    // If watermark is disabled, don't render anything
    if (!enabled) {
        return null;
    }

    const watermarkText = text || userName || 'EXAM IN PROGRESS';

    return (
        <>
            <div className="exam-watermark" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                opacity: 0.08,
                overflow: 'hidden'
            }}>
                {Array.from({ length: quantity }).map((_, index) => {
                    const rows = Math.ceil(Math.sqrt(quantity));
                    const cols = Math.ceil(quantity / rows);
                    const row = Math.floor(index / cols);
                    const col = index % cols;

                    return (
                        <div
                            key={index}
                            style={{
                                position: 'absolute',
                                top: `${(row / rows) * 100}%`,
                                left: `${(col / cols) * 100}%`,
                                transform: 'rotate(-45deg)',
                                fontSize: `${fontSize}px`,
                                fontWeight: '700',
                                color: '#000',
                                whiteSpace: 'nowrap',
                                userSelect: 'none'
                            }}
                        >
                            {watermarkText}
                        </div>
                    );
                })}
            </div>

            {/* Print Prevention */}
            <style jsx global>{`
                @media print {
                    body {
                        display: none !important;
                    }
                }
                
                /* Prevent text selection during exam */
                .exam-container {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                
                .exam-container textarea,
                .exam-container input[type="text"] {
                    -webkit-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                    user-select: text;
                }
            `}</style>
        </>
    );
}
