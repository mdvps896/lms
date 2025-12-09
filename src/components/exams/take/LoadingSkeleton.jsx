'use client';
import React from 'react';

export default function LoadingSkeleton() {
    return (
        <div className="loading-skeleton" style={{
            height: '100vh',
            background: '#f5f5f5'
        }}>
            {/* Header Skeleton */}
            <div style={{
                background: '#0891b2',
                height: '60px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px'
            }}>
                <div style={{
                    width: '200px',
                    height: '24px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
                <div style={{
                    width: '150px',
                    height: '36px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
            </div>

            <div style={{
                display: 'flex',
                height: 'calc(100vh - 60px)'
            }}>
                {/* Main Content Skeleton */}
                <div style={{
                    flex: 1,
                    padding: '20px'
                }}>
                    {/* Tabs Skeleton */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                style={{
                                    width: '120px',
                                    height: '40px',
                                    background: 'white',
                                    borderRadius: '4px',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Question Card Skeleton */}
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '28px',
                            background: '#e9ecef',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}></div>

                        <div style={{
                            width: '100%',
                            height: '20px',
                            background: '#e9ecef',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}></div>
                        <div style={{
                            width: '80%',
                            height: '20px',
                            background: '#e9ecef',
                            borderRadius: '4px',
                            marginBottom: '24px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}></div>

                        {/* Options Skeleton */}
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    background: '#e9ecef',
                                    borderRadius: '6px',
                                    marginBottom: '12px',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Controls Skeleton */}
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{
                            width: '150px',
                            height: '40px',
                            background: '#e9ecef',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}></div>
                        <div style={{
                            display: 'flex',
                            gap: '10px'
                        }}>
                            {[1, 2].map(i => (
                                <div
                                    key={i}
                                    style={{
                                        width: '120px',
                                        height: '40px',
                                        background: '#e9ecef',
                                        borderRadius: '4px',
                                        animation: 'pulse 1.5s ease-in-out infinite'
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div style={{
                    width: '300px',
                    background: 'white',
                    borderLeft: '1px solid #dee2e6',
                    padding: '15px'
                }}>
                    {/* Grid Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px',
                        marginTop: '60px'
                    }}>
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: '#e9ecef',
                                    borderRadius: '4px',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
}
