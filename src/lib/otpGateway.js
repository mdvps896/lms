import Settings from '@/models/Settings';
import { sendMsg91Otp, verifyMsg91Otp } from '@/lib/msg91';

/**
 * App OTP provider helpers for flows where the user is already logged in
 * (e.g. a Google user adding + verifying a mobile number). The login flow
 * itself lives in api/auth/send-mobile-otp and verify-mobile-login.
 */

export async function getAppOtpSettings() {
    const settings = await Settings.findOne();
    const app = settings?.authSettings?.app;
    return {
        enabled: app?.enableMobileOTP === true,
        provider: app?.smsProvider || 'firebase',
        twoFactorApiKey: app?.twoFactorApiKey || process.env.TWOFACTOR_API_KEY || '',
        twoFactorTemplateName: app?.twoFactorTemplateName || 'AUTOGEN',
    };
}

/** Sends an OTP through the configured gateway. Firebase OTPs are sent by the client. */
export async function sendGatewayOtp(mobile, channel) {
    const cfg = await getAppOtpSettings();

    if (cfg.provider === 'firebase') {
        return { success: true, provider: 'firebase' };
    }

    if (cfg.provider === 'msg91') {
        const sent = await sendMsg91Otp(mobile, channel === 'sms' || channel === 'whatsapp' ? channel : undefined);
        if (!sent.success) return { success: false, message: sent.message };
        return { success: true, provider: 'msg91', sessionId: sent.sessionId, channel: sent.channel };
    }

    // 2Factor.in
    if (!cfg.twoFactorApiKey) return { success: false, message: 'SMS Gateway not configured (API Key missing)' };
    try {
        const res = await fetch(`https://2factor.in/API/V1/${cfg.twoFactorApiKey}/SMS/${mobile}/${cfg.twoFactorTemplateName}`);
        const data = await res.json();
        if (data.Status !== 'Success') return { success: false, message: 'Failed to send OTP via SMS Gateway' };
        return { success: true, provider: '2factor', sessionId: data.Details };
    } catch (error) {
        console.error('SMS Gateway Error:', error);
        return { success: false, message: 'SMS Gateway error' };
    }
}

/** Verifies a gateway (non-Firebase) OTP. */
export async function verifyGatewayOtp(mobile, otp, sessionId) {
    const cfg = await getAppOtpSettings();

    if (cfg.provider === 'msg91') {
        return verifyMsg91Otp(mobile, otp, sessionId);
    }
    if (cfg.provider === '2factor') {
        if (!cfg.twoFactorApiKey) return { success: false, message: 'SMS Gateway configuration missing' };
        // sessionId goes into a URL path — keep it to a safe charset.
        if (!sessionId || !/^[A-Za-z0-9-]{1,64}$/.test(String(sessionId))) {
            return { success: false, message: 'Invalid OTP or session' };
        }
        try {
            const res = await fetch(`https://2factor.in/API/V1/${encodeURIComponent(cfg.twoFactorApiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(otp)}`);
            const data = await res.json();
            return data.Status === 'Success' ? { success: true } : { success: false, message: 'Invalid OTP or expired session' };
        } catch (error) {
            console.error('2Factor Verification Error:', error);
            return { success: false, message: 'OTP verification failed' };
        }
    }
    return { success: false, message: 'OTP provider does not support this verification' };
}
