import crypto from 'crypto';

/**
 * Per-account OTP attempt limiting, persisted on the user document.
 *
 * 🔒 SECURITY: the OTP verification endpoints (/auth/verify-2fa,
 * /auth/reset-password, /auth/verify-registration-otp) are public and used to
 * count nothing at all, so a 6-digit code could simply be enumerated inside
 * its validity window — a complete 2FA bypass and account takeover.
 *
 * The in-memory Map in otpRateLimit.js is not a substitute: it is per-process,
 * so it resets on every deploy and is bypassed entirely by hitting a different
 * instance behind a load balancer.
 */

export const MAX_OTP_ATTEMPTS = 5;

/** Generate a cryptographically secure numeric OTP (default 6 digits). */
export function generateOtp(digits = 6) {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits;
    // crypto.randomInt, not Math.random — Math.random is not a CSPRNG and its
    // output is predictable from observed values.
    return String(crypto.randomInt(min, max));
}

/** Constant-time OTP comparison, so response timing can't leak a prefix. */
export function otpMatches(expected, provided) {
    if (typeof expected !== 'string' || typeof provided !== 'string') return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function readAttempts(user, purpose) {
    const store = user?.otpAttempts;
    if (!store) return 0;
    const value = typeof store.get === 'function' ? store.get(purpose) : store[purpose];
    return Number(value) || 0;
}

/**
 * @returns {{ exceeded: boolean, attemptsLeft: number }}
 */
export function checkOtpAttempts(user, purpose) {
    const used = readAttempts(user, purpose);
    return {
        exceeded: used >= MAX_OTP_ATTEMPTS,
        attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - used)
    };
}

/**
 * Record a failed attempt. Once the limit is hit the OTP itself is destroyed,
 * so the attacker has to request a new one (which is rate limited) instead of
 * continuing to guess against the same code.
 */
export async function recordFailedOtpAttempt(UserModel, userId, purpose, otpFields = []) {
    const key = `otpAttempts.${purpose}`;
    const updated = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { [key]: 1 } },
        { new: true }
    );

    const used = readAttempts(updated, purpose);
    if (used >= MAX_OTP_ATTEMPTS && otpFields.length > 0) {
        const unset = {};
        for (const field of otpFields) unset[field] = 1;
        await UserModel.findByIdAndUpdate(userId, { $unset: unset });
    }

    return { exceeded: used >= MAX_OTP_ATTEMPTS, attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - used) };
}

/** Clear the counter after a successful verification or a freshly issued OTP. */
export async function clearOtpAttempts(UserModel, userId, purpose) {
    await UserModel.findByIdAndUpdate(userId, { $unset: { [`otpAttempts.${purpose}`]: 1 } });
}
