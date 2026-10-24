// Checks that a student whose 2h access token has run out mid-exam can still
// save answers (see getValidRefreshPayload in src/middleware.js).
//
// It mints tokens exactly the way the server does, puts them in the state a
// 2-3h exam ends up in, and calls the REAL endpoints of a running server.
// The save-answer call has an empty body, so nothing is written to the DB:
// passing auth yields 400 "Missing required fields", failing auth yields 401.
//
// Usage (from the exam/ folder):
//   node scripts/check-long-exam-auth.mjs                      -> http://localhost:3000
//   node scripts/check-long-exam-auth.mjs https://your-site.com
// JWT_SECRET is read from the environment, else from .env.local. It must be
// the SAME secret the target server uses, so run it on the server for live.

import { SignJWT } from 'jose';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

function loadSecret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    for (const file of ['.env.local', '.env.production', '.env']) {
        const full = path.join(process.cwd(), file);
        if (!fs.existsSync(full)) continue;
        const line = fs.readFileSync(full, 'utf8').split(/\r?\n/)
            .find(l => /^\s*JWT_SECRET\s*=/.test(l));
        if (line) return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
    return null;
}

const JWT_SECRET = loadSecret();
if (!JWT_SECRET) {
    console.error('JWT_SECRET not found (env or .env.local). Run this from the exam/ folder.');
    process.exit(2);
}
const key = new TextEncoder().encode(JWT_SECRET);
const now = Math.floor(Date.now() / 1000);

const claims = {
    userId: '000000000000000000000001',
    email: 'long-exam-check@example.com',
    role: 'student',
    permissions: [],
    accessScope: 'own',
};

const sign = (payload, iat, exp, k = key) =>
    new SignJWT(payload).setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat).setExpirationTime(exp).sign(k);

// Access token issued 3h ago, expired 1h ago (= a student 3h into an exam).
const expiredAccess = await sign(claims, now - 3 * 3600, now - 3600);
// Refresh token issued at login 3h ago, still valid for 30d.
const refresh = await sign({ ...claims, typ: 'refresh' }, now - 3 * 3600, now + 30 * 86400);
// Same shape, wrong secret: must be rejected.
const forgedRefresh = await sign({ ...claims, typ: 'refresh' }, now, now + 86400,
    new TextEncoder().encode('x'.repeat(40)));
// A (valid) access token presented as a refresh token: must be rejected.
const accessAsRefresh = await sign(claims, now, now + 3600);

async function saveAnswer(headers) {
    const res = await fetch(`${BASE_URL}/api/exams/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: '{}',
        redirect: 'manual',
    });
    let body = '';
    try { body = await res.text(); } catch { }
    return { status: res.status, body: body.slice(0, 120), res };
}

const results = [];
function check(name, ok, detail) {
    results.push(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      ${detail}`);
}

console.log(`Target: ${BASE_URL}\n`);

try {
    // --- Must be ACCEPTED ---------------------------------------------------
    let r = await saveAnswer({ Cookie: `refreshToken=${refresh}` });
    check('Web, after 2h: access cookie gone, only refresh cookie left',
        r.status !== 401 && r.status !== 403 && /token=/.test(r.res.headers.get('set-cookie') || ''),
        `HTTP ${r.status} ${r.body} | new token cookie: ${/token=/.test(r.res.headers.get('set-cookie') || '')}`);

    r = await saveAnswer({ Cookie: `token=${expiredAccess}; refreshToken=${refresh}` });
    check('Web, after 2h: expired access cookie + refresh cookie',
        r.status !== 401 && r.status !== 403,
        `HTTP ${r.status} ${r.body}`);

    r = await saveAnswer({ Authorization: `Bearer ${expiredAccess}` });
    check('Mobile app, after 2h: expired Bearer token',
        r.status !== 401 && r.status !== 403 && !!r.res.headers.get('x-new-token'),
        `HTTP ${r.status} ${r.body} | x-new-token: ${!!r.res.headers.get('x-new-token')}`);

    const page = await fetch(`${BASE_URL}/my-exams`, {
        headers: { Cookie: `refreshToken=${refresh}` }, redirect: 'manual',
    });
    const loc = page.headers.get('location') || '';
    check('Web page reload after 2h: not sent to login',
        !loc.includes('/authentication/login'),
        `HTTP ${page.status}${loc ? ` -> ${loc}` : ''}`);

    // --- Must be REJECTED (proves the checks above mean something) ----------
    r = await saveAnswer({});
    check('No token at all is rejected', r.status === 401, `HTTP ${r.status}`);

    r = await saveAnswer({ Cookie: `refreshToken=${forgedRefresh}` });
    check('Forged refresh token is rejected', r.status === 401, `HTTP ${r.status}`);

    r = await saveAnswer({ Cookie: `refreshToken=${accessAsRefresh}` });
    check('Access token posing as refresh token is rejected', r.status === 401, `HTTP ${r.status}`);
} catch (e) {
    console.error(`\nCould not reach ${BASE_URL}: ${e.cause?.code || e.message}`);
    console.error('Is the server running? (npm run dev, or check the URL)');
    process.exit(2);
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${failed ? `${failed} check(s) FAILED` : 'All checks passed — long exams will not lose the session.'}`);
process.exit(failed ? 1 : 0);
