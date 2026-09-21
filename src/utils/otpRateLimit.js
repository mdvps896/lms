import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const otpAttempts = new Map();
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

// `options` lets non-OTP callers (e.g. the public e-sign upload flow, which
// legitimately needs several requests per session) loosen the limits
// without weakening the default OTP/login/reset-password throttling.
export function checkOTPRateLimit(identifier, options = {}) {
    const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
    const attemptWindow = options.attemptWindowMs ?? ATTEMPT_WINDOW;
    const blockDuration = options.blockDurationMs ?? BLOCK_DURATION;

    const now = Date.now();
    const userAttempts = otpAttempts.get(identifier);

    if (!userAttempts) {
        // First attempt
        otpAttempts.set(identifier, {
            count: 1,
            firstAttempt: now,
            blockedUntil: null
        });
        return { allowed: true };
    }

    // Check if user is currently blocked
    if (userAttempts.blockedUntil && now < userAttempts.blockedUntil) {
        const remainingTime = Math.ceil((userAttempts.blockedUntil - now) / 1000);
        return {
            allowed: false,
            message: `Too many requests. Please try again in ${remainingTime} seconds.`,
            remainingTime
        };
    }

    // Reset if attempt window has passed
    if (now - userAttempts.firstAttempt > attemptWindow) {
        otpAttempts.set(identifier, {
            count: 1,
            firstAttempt: now,
            blockedUntil: null
        });
        return { allowed: true };
    }

    // Increment attempt count
    userAttempts.count++;

    // Block if exceeded max attempts
    if (userAttempts.count > maxAttempts) {
        userAttempts.blockedUntil = now + blockDuration;
        otpAttempts.set(identifier, userAttempts);

        return {
            allowed: false,
            message: `Too many requests. Please try again after ${Math.ceil(blockDuration / 60000)} minutes.`,
            remainingTime: Math.ceil(blockDuration / 1000)
        };
    }

    otpAttempts.set(identifier, userAttempts);
    return { allowed: true, attemptsLeft: maxAttempts - userAttempts.count };
}

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpAttempts.entries()) {
        if (value.blockedUntil && now > value.blockedUntil) {
            otpAttempts.delete(key);
        } else if (now - value.firstAttempt > BLOCK_DURATION) {
            otpAttempts.delete(key);
        }
    }
}, 60000); // Cleanup every minute
