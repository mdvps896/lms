import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

// MSG91 "OTP Widget" API (works without DLT). One widget per channel, created in
// MSG91 → OTP → Widgets. Endpoints match MSG91's own SDK (sendotp_flutter_sdk).
const WIDGET_URL = 'https://control.msg91.com/api/v5/widget';

export const MSG91_CHANNELS = ['sms', 'whatsapp'];

/**
 * Config saved from Settings → Integrations → MSG91:
 *   { authKey, sms: { enabled, widgetId, token }, whatsapp: { enabled, widgetId, token } }
 */
export async function getMsg91Config() {
    await connectDB();
    // .lean(): `integrations.msg91` is written by the raw settings PUT route.
    const settings = await Settings.findOne().lean();
    const saved = settings?.integrations?.msg91 || {};
    const channel = (name) => ({
        enabled: saved[name]?.enabled === true,
        widgetId: String(saved[name]?.widgetId || '').trim(),
        token: String(saved[name]?.token || '').trim(),
    });
    return {
        authKey: String(saved.authKey || process.env.MSG91_AUTH_KEY || '').trim(),
        sms: channel('sms'),
        whatsapp: channel('whatsapp'),
    };
}

/** Channels that are switched on and fully filled in. */
export function enabledChannels(config) {
    return MSG91_CHANNELS.filter((c) => config[c]?.enabled && config[c].widgetId && config[c].token);
}

// MSG91 wants country code + number, no '+'. Only 10-digit Indian numbers are collected.
function toMsisdn(mobile) {
    const digits = String(mobile).replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
}

async function post(path, body) {
    const res = await fetch(`${WIDGET_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { type: 'error', message: text.slice(0, 200) || `HTTP ${res.status}` };
    }
}

// The session id handed to the client is `<channel>_<reqId>_<sig>`. The
// signature binds the MSG91 request to the mobile number it was sent to;
// without it, someone could request an OTP for their own phone and then verify
// it while claiming a victim's number.
function sign(channel, reqId, mobile) {
    return crypto
        .createHmac('sha256', process.env.JWT_SECRET || '')
        .update(`${channel}|${reqId}|${mobile}`)
        .digest('hex')
        .slice(0, 32);
}

function parseSession(sessionId, mobile) {
    const parts = String(sessionId || '').split('_');
    if (parts.length !== 3) return null;
    const [channel, reqId, sig] = parts;
    if (!MSG91_CHANNELS.includes(channel) || !reqId) return null;
    const expected = sign(channel, reqId, mobile);
    const ok = sig.length === expected.length
        && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    return ok ? { channel, reqId } : null;
}

/**
 * Sends an OTP on `channel` ('sms' | 'whatsapp'; default = first enabled).
 * `config` may override the saved one (used by the admin test box).
 */
export async function sendMsg91Otp(mobile, channel, config) {
    const cfg = config || (await getMsg91Config());
    const available = enabledChannels(cfg);
    const useChannel = channel || available[0];
    if (!useChannel || !MSG91_CHANNELS.includes(useChannel) || !cfg[useChannel]?.widgetId || !cfg[useChannel]?.token) {
        return { success: false, message: 'MSG91 is not configured for this channel (Widget ID / Token missing)' };
    }
    if (!config && !available.includes(useChannel)) {
        return { success: false, message: `OTP on ${useChannel === 'sms' ? 'SMS' : 'WhatsApp'} is not enabled` };
    }

    try {
        const data = await post('/sendOtpMobile', {
            widgetId: cfg[useChannel].widgetId,
            tokenAuth: cfg[useChannel].token,
            identifier: toMsisdn(mobile),
        });
        if (data.type !== 'success' || !data.message) {
            console.error('[MSG91] send failed:', data);
            // Include MSG91's raw answer so the admin test box shows the real reason.
            return {
                success: false,
                message: data.message || 'MSG91 could not send the OTP',
                detail: JSON.stringify(data).slice(0, 300)
            };
        }
        return {
            success: true,
            channel: useChannel,
            sessionId: `${useChannel}_${data.message}_${sign(useChannel, data.message, String(mobile))}`,
        };
    } catch (error) {
        console.error('[MSG91] send error:', error);
        return { success: false, message: 'Could not reach MSG91' };
    }
}

/** Verifies the OTP for a session id returned by sendMsg91Otp. */
export async function verifyMsg91Otp(mobile, otp, sessionId, config) {
    const cfg = config || (await getMsg91Config());
    const session = parseSession(sessionId, String(mobile));
    if (!session) return { success: false, message: 'Invalid or expired session. Please request a new OTP.' };

    const { widgetId, token } = cfg[session.channel] || {};
    if (!widgetId || !token) return { success: false, message: 'MSG91 is not configured for this channel' };

    try {
        const data = await post('/verifyOtp', {
            widgetId,
            tokenAuth: token,
            reqId: session.reqId,
            otp: String(otp),
        });
        if (data.type !== 'success') {
            return { success: false, message: data.message || 'Invalid or expired OTP' };
        }

        // Second, server-side confirmation of the access token with the Auth Key.
        if (cfg.authKey && data.message) {
            const confirm = await post('/verifyAccessToken', {
                authkey: cfg.authKey,
                'access-token': data.message,
            });
            if (confirm.type !== 'success') {
                console.error('[MSG91] verifyAccessToken failed:', confirm);
                return { success: false, message: confirm.message || 'Could not confirm the OTP with MSG91' };
            }
        }
        return { success: true };
    } catch (error) {
        console.error('[MSG91] verify error:', error);
        return { success: false, message: 'Could not reach MSG91' };
    }
}
