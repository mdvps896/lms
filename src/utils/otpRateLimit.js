import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const otpAttempts = new Map();
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

export function checkOTPRateLimit(identifier) {
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
            message: `Too many OTP requests. Please try again in ${remainingTime} seconds.`,
            remainingTime
        };
    }

    // Reset if attempt window has passed
    if (now - userAttempts.firstAttempt > ATTEMPT_WINDOW) {
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
    if (userAttempts.count > MAX_ATTEMPTS) {
        userAttempts.blockedUntil = now + BLOCK_DURATION;
        otpAttempts.set(identifier, userAttempts);

        return {
            allowed: false,
            message: `Too many OTP requests. Please try again after 15 minutes.`,
            remainingTime: Math.ceil(BLOCK_DURATION / 1000)
        };
    }

    otpAttempts.set(identifier, userAttempts);
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS - userAttempts.count };
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
