import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-app-settings
 * Returns app-specific authentication settings for mobile app
 * PUBLIC ENDPOINT - No authentication required
 */
export async function GET() {
    try {
        await connectDB();

        const settings = await Settings.findOne();

        if (!settings || !settings.authSettings || !settings.authSettings.app) {
            // Return default settings if not configured
            return NextResponse.json({
                success: true,
                data: {
                    enableRegistration: true,
                    enableMobileOTP: false,
                    allowEmailAuth: true,
                    allowGoogleAuth: true
                }
            });
        }

        const appSettings = {
            enableRegistration: settings.authSettings?.app?.enableRegistration ?? true,
            enableMobileOTP: settings.authSettings?.app?.enableMobileOTP ?? false,
            allowEmailAuth: settings.authSettings?.app?.allowEmailAuth ?? true,
            allowGoogleAuth: settings.authSettings?.app?.allowGoogleAuth ?? true
        };

        return NextResponse.json({
            success: true,
            data: appSettings
        });

    } catch (error) {
        console.error('Error fetching app settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch app settings' },
            { status: 500 }
        );
    }
}
