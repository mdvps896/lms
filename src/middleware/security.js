import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

/**
 * 🔒 Security Middleware for API Protection
 * Prevents common attacks: XSS, SQL Injection, NoSQL Injection, etc.
 */

// Sanitize string inputs to prevent XSS and injection attacks
export function sanitizeString(input) {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>'"`;(){}[\]\\]/g, '') // Remove dangerous characters
        .substring(0, 1000); // Limit length to prevent DoS
}

// Validate email format
export function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}

// Validate MongoDB ObjectId
export function validateObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Validate phone number (10 digits)
export function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

// Sanitize object recursively
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip dangerous keys
        if (key.startsWith('$') || key.includes('.')) {
            continue;
        }
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}

// Check for NoSQL injection patterns
export function detectNoSQLInjection(obj) {
    const dangerousPatterns = ['$where', '$regex', '$ne', '$gt', '$lt', '$in', '$nin'];
    const str = JSON.stringify(obj);

    for (const pattern of dangerousPatterns) {
        if (str.includes(pattern)) {
            return true;
        }
    }
    return false;
}

// Rate limiting helper (IP-based)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per window

export function checkRateLimit(identifier) {
    const now = Date.now();
    const userRequests = requestCounts.get(identifier) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    // Reset if window expired
    if (now > userRequests.resetTime) {
        requestCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    // Increment count
    userRequests.count++;
    requestCounts.set(identifier, userRequests);

    // Check if exceeded
    if (userRequests.count > MAX_REQUESTS) {
        return {
            allowed: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        };
    }

    return { allowed: true, remaining: MAX_REQUESTS - userRequests.count };
}

// Get client IP address
export function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

// Validate request body size
export function validateBodySize(body) {
    const bodyStr = JSON.stringify(body);
    const sizeInMB = new Blob([bodyStr]).size / (1024 * 1024);

    if (sizeInMB > 10) { // Max 10MB
        return {
            valid: false,
            message: 'Request body too large'
        };
    }

    return { valid: true };
}

// Security headers
export function addSecurityHeaders(response) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return response;
}

// Main security middleware
export async function securityMiddleware(request, handler) {
    try {
        // Get client IP
        const clientIP = getClientIP(request);

        // Check rate limit
        const rateLimit = checkRateLimit(clientIP);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: rateLimit.message,
                    retryAfter: rateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimit.retryAfter.toString()
                    }
                }
            );
        }

        // Parse and validate body if POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            try {
                const body = await request.json();

                // Validate body size
                const sizeCheck = validateBodySize(body);
                if (!sizeCheck.valid) {
                    return NextResponse.json(
                        { success: false, message: sizeCheck.message },
                        { status: 413 }
                    );
                }

                // Check for NoSQL injection
                if (detectNoSQLInjection(body)) {
                    console.warn(`🚨 NoSQL injection attempt detected from IP: ${clientIP}`);
                    return NextResponse.json(
                        { success: false, message: 'Invalid request' },
                        { status: 400 }
                    );
                }

                // Sanitize body
                const sanitizedBody = sanitizeObject(body);

                // Replace request body with sanitized version
                request.sanitizedBody = sanitizedBody;
            } catch (e) {
                return NextResponse.json(
                    { success: false, message: 'Invalid JSON' },
                    { status: 400 }
                );
            }
        }

        // Call the actual handler
        const response = await handler(request);

        // Add security headers
        return addSecurityHeaders(response);

    } catch (error) {
        console.error('Security middleware error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Cleanup old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 60000); // Cleanup every minute
