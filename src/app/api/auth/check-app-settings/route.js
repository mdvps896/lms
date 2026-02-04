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
            allowGoogleAuth: settings.authSettings?.app?.allowGoogleAuth ?? true,
            // Include payment integration settings for mobile app
            integrations: {
                offlinePayments: {
                    enabled: settings.integrations?.offlinePayments?.enabled ?? false,
                    message: settings.integrations?.offlinePayments?.message ?? 'Please pay offline'
                },
                razorpay: {
                    enabled: settings.integrations?.razorpay?.enabled ?? false
                }
            },
            pdfSelfieSettings: {
                enabled: settings.pdfSelfieSettings?.enabled ?? true,
                intervalInMinutes: settings.pdfSelfieSettings?.intervalInMinutes ?? 5,
                captureOnStart: settings.pdfSelfieSettings?.captureOnStart ?? true,
                captureOnEnd: settings.pdfSelfieSettings?.captureOnEnd ?? false
            },
            whatsappSupport: {
                phoneNumber: settings.whatsappSupport?.phoneNumber ?? '',
                message: settings.whatsappSupport?.message ?? '',
                enabled: settings.whatsappSupport?.enabled ?? false,
                primaryMethod: settings.whatsappSupport?.primaryMethod ?? 'chat'
            },
            appLink: settings.general?.appLink ?? ''
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
