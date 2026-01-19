import admin from 'firebase-admin';
import path from 'path';

let firebaseApp;

export function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        firebaseApp = admin.app();
        return firebaseApp;
    }

    try {
        // Use absolute path to find the service account file
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
        const serviceAccount = require(serviceAccountPath);

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin initialized with service account');
    } catch (error) {
        console.warn('⚠️ Service account file not found/loaded:', error.message);
        console.warn('⚠️ Attempting to use environment variables...');

        // Fallback to environment variables
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                })
            });
            console.log('✅ Firebase Admin initialized with environment variables');
        } else {
            console.error('❌ Firebase Admin initialization failed: No credentials found');
            throw new Error('Firebase Admin initialization failed');
        }
    }
    return firebaseApp;
}

export async function verifyFirebaseToken(idToken) {
    try {
        if (!firebaseApp) {
            initializeFirebaseAdmin();
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return {
            success: true,
            uid: decodedToken.uid,
            phoneNumber: decodedToken.phone_number,
            email: decodedToken.email,
        };
    } catch (error) {
        console.error('Firebase token verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default admin;
