'use client';
import React, { useRef, useEffect } from 'react';

export default function LocalStreamView({ cameraStream, screenStream }) {
    const cameraVideoRef = useRef(null);
    const screenVideoRef = useRef(null);

    console.log('LocalStreamView render:', { cameraStream: !!cameraStream, screenStream: !!screenStream });

    useEffect(() => {
        // Set camera stream to video element
        if (cameraVideoRef.current && cameraStream) {
            cameraVideoRef.current.srcObject = cameraStream;
        }

        return () => {
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = null;
            }
        };
    }, [cameraStream]);

    useEffect(() => {
        // Set screen stream to video element
        if (screenVideoRef.current && screenStream) {
            screenVideoRef.current.srcObject = screenStream;
        }

        return () => {
            if (screenVideoRef.current) {
                screenVideoRef.current.srcObject = null;
            }
        };
    }, [screenStream]);

    return (
        <div className="local-stream-view" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px',
            zIndex: 100,
            flexDirection: 'column'
        }}>
            {/* Camera Feed */}
            {cameraStream && (
                <div style={{
                    width: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    backgroundColor: '#000',
                    border: '2px solid #0891b2'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '75%',
                        backgroundColor: '#000'
                    }}>
                        <video
                            ref={cameraVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            left: '5px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}>
                            Camera Feed
                        </div>
                        {/* Status indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#00ff00',
                            boxShadow: '0 0 4px rgba(0,255,0,0.6)'
                        }} />
                    </div>
                </div>
            )}

            {/* Screen Feed */}
            {screenStream && (
                <div style={{
                    width: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    backgroundColor: '#000',
                    border: '2px solid #06b6d4'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                        backgroundColor: '#000'
                    }}>
                        <video
                            ref={screenVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            left: '5px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}>
                            Screen Feed
                        </div>
                        {/* Status indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#00ff00',
                            boxShadow: '0 0 4px rgba(0,255,0,0.6)'
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}
