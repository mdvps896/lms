import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-registration-enabled
 * Check if user registration is enabled in settings
 * Supports platform parameter: ?platform=web or ?platform=app
 */
export async function GET(request) {
    try {
        await connectDB();

        // Get platform from query params (default to web for backward compatibility)
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') || 'web';

        const settings = await Settings.findOne();

        let registrationEnabled = false;

        if (settings?.authSettings) {
            // Use new platform-specific settings
            if (platform === 'app') {
                registrationEnabled = settings.authSettings.app?.enableRegistration ?? true;
            } else {
                registrationEnabled = settings.authSettings.web?.enableRegistration ?? true;
            }
        } else {
            // Fallback to legacy settings for backward compatibility
            registrationEnabled =
                settings?.authPages?.enableRegistration === true ||
                settings?.loginRegister?.enableUserRegistration === true ||
                settings?.general?.enableRegistration === true ||
                false;
        }

        return NextResponse.json({
            success: true,
            registrationEnabled,
            platform
        });

    } catch (error) {
        console.error('❌ Check Registration Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
            registrationEnabled: false
        }, { status: 500 });
    }
}

