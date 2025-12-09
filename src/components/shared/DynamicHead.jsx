'use client';
import { useEffect, useState } from 'react';

export default function DynamicHead() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();
                if (data.success) {
                    setSettings(data.data);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!loading && settings?.general && typeof document !== 'undefined') {
            const { siteName, seoTitle, seoDescription, siteFavIcon } = settings.general;

            // Update page title
            document.title = seoTitle || siteName || 'Exam Portal';

            // Update meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }
            metaDescription.content = seoDescription || 'Professional online examination platform';

            // Add Google OAuth meta tag for cross-origin
            let googleMeta = document.querySelector('meta[name="google-signin-client_id"]');
            if (!googleMeta) {
                googleMeta = document.createElement('meta');
                googleMeta.name = 'google-signin-client_id';
                googleMeta.content = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
                document.head.appendChild(googleMeta);
            }

            // Update favicon - remove all existing favicons first to prevent flicker
            if (siteFavIcon) {
                // Remove all existing favicon links
                const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
                existingFavicons.forEach(link => link.remove());

                // Create new favicon link
                const favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = siteFavIcon;
                favicon.type = 'image/x-icon';
                document.head.appendChild(favicon);
            }
        }
    }, [settings, loading]);

    return null;
}
