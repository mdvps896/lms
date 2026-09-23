import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';

// Re-use logic from firebaseAdmin.js to ensure initialization
function initFirebase() {
    if (admin.apps.length > 0) return admin;
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        return admin;
    } catch (e) {
        return null;
    }
}

/**
 * POST /api/auth/migrate
 * Verifies legacy credentials and creates a Firebase account for existing users
 */
export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 });
        }

        await connectDB();

        // 1. Find user in MongoDB
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // 2. Verify legacy password
        if (!user.password) {
            return NextResponse.json({ success: false, message: 'Account has no local password to migrate' }, { status: 400 });
        }
        let isPasswordValid = false;
        if (user.password.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            isPasswordValid = user.password === password;
        }

        if (!isPasswordValid) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        // 3. Create user in Firebase Auth
        const firebaseAdmin = initFirebase();
        if (!firebaseAdmin) {
            return NextResponse.json({ success: false, message: 'Auth service unavailable' }, { status: 500 });
        }

        try {
            await firebaseAdmin.auth().createUser({
                email: user.email,
                password: password,
                displayName: user.name,
                uid: user.firebaseUid || undefined // Use existing if available
            });
        } catch (firebaseErr) {
            if (firebaseErr.code === 'auth/email-already-exists' || firebaseErr.code === 'auth/uid-already-exists') {
                // Passwords are changed in MongoDB only (change/reset password,
                // admin edits) — Firebase is never told, so its copy goes stale
                // and the app's Firebase sign-in keeps failing. The caller has
                // just proved the current password above, so bring Firebase in
                // line. Previously this answered "Already migrated" without
                // fixing anything, and the app retried sign-in in a loop until
                // Firebase blocked the device for "unusual activity".
                const existing = await firebaseAdmin.auth().getUserByEmail(user.email);
                await firebaseAdmin.auth().updateUser(existing.uid, { password });
                return NextResponse.json({ success: true, message: 'Password synced' });
            }
            throw firebaseErr;
        }

        return NextResponse.json({ success: true, message: 'Migration successful' });

    } catch (error) {
        console.error('❌ Migration Error:', error);
        return NextResponse.json({ success: false, message: 'Migration failed' }, { status: 500 });
    }
}
