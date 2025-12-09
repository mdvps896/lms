'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Start loading when route changes
        setLoading(true);
        setProgress(0);

        // Smoothly animate to 95%
        const timer1 = setTimeout(() => setProgress(30), 50);
        const timer2 = setTimeout(() => setProgress(60), 150);
        const timer3 = setTimeout(() => setProgress(80), 300);
        const timer4 = setTimeout(() => setProgress(95), 500);

        // Complete to 100% when page is actually loaded
        const completeTimer = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 300);
        }, 800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(completeTimer);
        };
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                zIndex: 99999,
                background: 'transparent',
            }}
        >
            <div
                style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                    width: `${progress}%`,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                }}
            />
        </div>
    );
}

export default function TopProgressBar() {
    return (
        <Suspense fallback={null}>
            <ProgressBarContent />
        </Suspense>
    );
}
