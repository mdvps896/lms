import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

// Default settings structure
const defaultSettings = {
    general: {
        adminName: 'Admin',
        contactEmail: 'admin@example.com',
        phoneNumber: '',
        timeZone: 'UTC',
        emailNotifications: true,
        siteLogo: '/images/logo-full.png',
        siteLogoWidth: 150,
        siteLogoHeight: 50,
        siteFavIcon: '/images/logo/favicon.ico',
        siteSmallLogo: '/images/logo-abbr.png',
        siteSmallLogoWidth: 40,
        siteSmallLogoHeight: 40,
        digitalSignature: '',
        siteName: 'Duralux Exam Portal',
        seoTitle: 'Online Exam System',
        seoDescription: 'Professional online examination platform',
        examHeaderText: 'Welcome to the Examination Portal',
        examFooterText: 'Good luck with your exam!',
        showProgressBar: true,
        showQuestionNumbers: true,
        questionsPerPage: 1
    },
    authPages: {
        enableRegistration: true,
        loginBgImage: '/images/auth/auth-cover-login-bg.svg',
        registerBgImage: '/images/auth/auth-cover-register-bg.svg',
        resetBgImage: '/images/auth/auth-cover-reset-bg.svg',
        termsConditions: `<h6>1. Acceptance of Terms</h6>
<p>By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h6>2. User Accounts</h6>
<p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

<h6>3. Privacy Policy</h6>
<p>Your use of this platform is also governed by our Privacy Policy. We collect and process your personal information in accordance with applicable data protection laws.</p>

<h6>4. User Conduct</h6>
<p>You agree not to use the platform for any unlawful purpose or any purpose prohibited under this clause.</p>

<h6>5. Intellectual Property</h6>
<p>All content included on this platform is protected by applicable copyright and trademark law.</p>

<h6>6. Limitation of Liability</h6>
<p>We shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the platform.</p>

<h6>7. Termination</h6>
<p>We reserve the right to terminate or suspend your account at any time without prior notice for violating these terms.</p>`
    },
    resultDisplay: {
        showCorrectAnswers: true,
        showQuestionwiseScores: true,
        resultDisplayFormat: 'Detailed',
        showTimeTaken: true,
        showDifficultyLevel: false,
        allowResultDownload: true
    },
    themeDesign: {
        uiCustomization: {
            primaryColor: '#0d6efd',
            secondaryColor: '#6c757d',
            sidebarBackground: '#212529',
            sidebarTextColor: '#ffffff',
            sidebarHoverColor: '#495057',
            activeMenuColor: '#0d6efd',
            activeMenuText: '#ffffff',
            topBarBackground: '#ffffff',
            topBarTextColor: '#212529',
            buttonHoverColor: '#0b5ed7',
            fontFamily: 'Poppins',
            fontSize: '14px'
        },
        examDesign: {
            headerColor: '#0d6efd',
            primaryColor: '#0d6efd',
            secondaryColor: '#6c757d',
            buttonColor: '#0d6efd'
        }
    },
    securitySMTP: {
        security: {
            currentPassword: '',
            examSecurity: {
                preventCopyPaste: true,
                fullScreenMode: true,
                tabSwitchDetection: true,
                micPermission: false,
                camPermission: true,
                screenShare: false
            },
            twoFactorAuth: false
        },
        smtp: {
            smtpHost: '',
            smtpPort: 587,
            smtpUsername: '',
            smtpPassword: '',
            smtpSecure: true,
            fromEmail: '',
            fromName: ''
        }
    },
    integrations: {
        googleOAuth: {
            enabled: false,
            clientId: '',
            clientSecret: ''
        },
        recaptcha: {
            enabled: false,
            siteKey: '',
            secretKey: ''
        },
        localStorage: {
            enabled: true,
            maxSizeMB: 100,
            compressionQuality: 80
        },
        razorpay: {
            enabled: false,
            keyId: '',
            keySecret: '',
            webhookSecret: '',
            webhookUrl: '',
            currency: 'INR'
        }
    },
    notifications: {
        chatNotificationSound: {
            enabled: true,
            soundFile: '/sounds/notification.mp3',
            volume: 0.7
        },
        examNotificationSound: {
            enabled: true,
            soundFile: '/sounds/exam-alert.mp3',
            volume: 0.8
        },
        warningSound: {
            enabled: true,
            soundFile: '/sounds/warning.mp3',
            volume: 0.9
        }
    },
    certificateSettings: {
        siteName: 'Duralux Exam Portal',
        tagline: 'Excellence in Education',
        primaryColor: '#0891b2',
        secondaryColor: '#4361ee',
        backgroundColor: '#ffffff',
        borderColor: '#0891b2',
        borderWidth: 20,
        watermarkOpacity: 0.03,
        watermarkEnabled: true,
        titleFontSize: 48,
        nameFontSize: 42,
        bodyFontSize: 18,
        signatureTitle1: 'Administrator',
        signatureSubtitle1: 'Duralux Exam Portal',
        signatureTitle2: 'Examiner',
        signatureSubtitle2: 'Authorized Signatory',
        sealText: 'OFFICIAL SEAL',
        showSeal: true,
        showCertificateId: true,
        showDate: true,
        fontFamily: 'Georgia, serif',
        logo: '',
        signatureImage1: '',
        signatureImage2: ''
    }
};

export async function GET() {
    try {
        await connectDB();
        const db = require('mongoose').connection.db;
        let settings = await db.collection('settings').findOne({});

        if (!settings) {
            // Create default settings if none exist
            await db.collection('settings').insertOne(defaultSettings);
            settings = defaultSettings;
        }

        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch settings'
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { tab, settings, data } = await request.json();

        // Support both 'settings' and 'data' parameter names for flexibility
        const settingsData = settings || data;

        await connectDB();
        const db = require('mongoose').connection.db;

        // Map tab names to database field names
        const tabFieldMap = {
            'general': 'general',
            'auth-pages': 'authPages',
            'auth-settings': 'authSettings',
            'result-display': 'resultDisplay',
            'theme-design': 'themeDesign',
            'security-smtp': 'securitySMTP',
            'integrations': 'integrations',
            'certificate': 'certificateSettings',
            'roll-number': 'rollNumberSettings',
            'pdf-selfie': 'pdfSelfieSettings',
            'whatsapp-support': 'whatsappSupport',
            'social-media': 'socialMediaLinks'
        };

        let result;

        if (tab === 'payment') {
            const updateQuery = {
                'integrations.razorpay': settingsData.razorpay,
                'integrations.offlinePayments': settingsData.offlinePayments
            };

            result = await db.collection('settings').updateOne({}, { $set: updateQuery }, { upsert: true });
        } else {
            const dbFieldName = tabFieldMap[tab] || tab;
            const updateQuery = {};
            updateQuery[dbFieldName] = settingsData;

            result = await db.collection('settings').updateOne(
                {},
                {
                    $set: updateQuery,
                    $setOnInsert: {
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }

        // Also update the updatedAt timestamp
        await db.collection('settings').updateOne(
            {},
            { $set: { updatedAt: new Date() } }
        );

        // Fetch updated settings
        const updatedSettings = await db.collection('settings').findOne({});

        return NextResponse.json({
            success: true,
            data: updatedSettings,
            message: `${tab.charAt(0).toUpperCase() + tab.slice(1)} settings updated successfully`
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({
            success: false,
            error: `Failed to update settings: ${error.message}`
        }, { status: 500 });
    }
}