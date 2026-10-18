import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/apiAuth';
import { getMsg91Config, sendMsg91Otp, verifyMsg91Otp, MSG91_CHANNELS } from '@/lib/msg91';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/test-msg91   (admin only)
 *   { action: 'send',   mobile, channel, authKey?, sms?, whatsapp? }
 *   { action: 'verify', mobile, otp, sessionId, authKey?, sms?, whatsapp? }
 * Values typed in the form but not yet saved override the saved config, so the
 * admin can test before saving. The channel's "enabled" switch is not required.
 */
export async function POST(request) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const mobile = String(body.mobile || '').trim();
        if (!/^[0-9]{10}$/.test(mobile)) {
            return NextResponse.json(
                { success: false, message: 'Enter a valid 10-digit mobile number' },
                { status: 400 }
            );
        }

        const saved = await getMsg91Config();
        const config = { authKey: String(body.authKey || '').trim() || saved.authKey };
        for (const channel of MSG91_CHANNELS) {
            config[channel] = {
                enabled: true,
                widgetId: String(body[channel]?.widgetId || '').trim() || saved[channel].widgetId,
                token: String(body[channel]?.token || '').trim() || saved[channel].token,
            };
        }

        if (body.action === 'verify') {
            const otp = String(body.otp || '').trim();
            if (!/^[0-9]{4,9}$/.test(otp)) {
                return NextResponse.json({ success: false, message: 'Enter the OTP you received' }, { status: 400 });
            }
            const result = await verifyMsg91Otp(mobile, otp, body.sessionId, config);
            return NextResponse.json(
                result.success
                    ? { success: true, message: 'OTP verified — MSG91 is working correctly' }
                    : result,
                { status: result.success ? 200 : 400 }
            );
        }

        if (!MSG91_CHANNELS.includes(body.channel)) {
            return NextResponse.json({ success: false, message: 'Choose SMS or WhatsApp' }, { status: 400 });
        }

        // Sends cost money; keep a runaway click-loop from burning credits.
        const limit = checkOTPRateLimit(`msg91-test:${mobile}`);
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: limit.message || 'Too many test OTPs. Try again shortly.' },
                { status: 429 }
            );
        }

        const result = await sendMsg91Otp(mobile, body.channel, config);
        return NextResponse.json(
            result.success
                ? { success: true, sessionId: result.sessionId, message: `OTP sent to ${mobile} on ${body.channel === 'sms' ? 'SMS' : 'WhatsApp'}` }
                : result,
            { status: result.success ? 200 : 400 }
        );
    } catch (error) {
        console.error('MSG91 test error:', error);
        return NextResponse.json({ success: false, message: 'MSG91 test failed' }, { status: 500 });
    }
}
