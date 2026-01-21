import mongoose from 'mongoose';

delete mongoose.models.Settings;

const settingsSchema = new mongoose.Schema({
    // Notification Settings
    chatNotificationSound: {
        enabled: { type: Boolean, default: true },
        soundFile: { type: String, default: '/sounds/notification.mp3' },
        volume: { type: Number, default: 0.7, min: 0, max: 1 }
    },
    examNotificationSound: {
        enabled: { type: Boolean, default: true },
        soundFile: { type: String, default: '/sounds/exam-alert.mp3' },
        volume: { type: Number, default: 0.8, min: 0, max: 1 }
    },
    warningSound: {
        enabled: { type: Boolean, default: true },
        soundFile: { type: String, default: '/sounds/warning.mp3' },
        volume: { type: Number, default: 0.9, min: 0, max: 1 }
    },
    // Certificate Settings
    certificateSettings: {
        siteName: { type: String, default: 'Exam Portal' },
        tagline: { type: String, default: 'Excellence in Education' },
        primaryColor: { type: String, default: '#0891b2' },
        secondaryColor: { type: String, default: '#4361ee' },
        backgroundColor: { type: String, default: '#ffffff' },
        borderColor: { type: String, default: '#0891b2' },
        borderWidth: { type: Number, default: 20 },
        watermarkOpacity: { type: Number, default: 0.03 },
        watermarkEnabled: { type: Boolean, default: true },
        titleFontSize: { type: Number, default: 48 },
        nameFontSize: { type: Number, default: 42 },
        bodyFontSize: { type: Number, default: 18 },
        signatureTitle1: { type: String, default: 'Administrator' },
        signatureSubtitle1: { type: String, default: '' },
        signatureTitle2: { type: String, default: 'Examiner' },
        signatureSubtitle2: { type: String, default: 'Authorized Signatory' },
        sealText: { type: String, default: 'OFFICIAL SEAL' },
        showSeal: { type: Boolean, default: true },
        showCertificateId: { type: Boolean, default: true },
        showDate: { type: Boolean, default: true },
        fontFamily: { type: String, default: 'Georgia, serif' },
        logo: { type: String, default: '' },
        signatureImage1: { type: String, default: '' },
        signatureImage2: { type: String, default: '' }
    },
    // Roll Number Settings
    rollNumberSettings: {
        prefix: { type: String, default: 'STU' },
        startFrom: { type: Number, default: 1001 },
        currentNumber: { type: Number, default: 1001 },
        digitLength: { type: Number, default: 4, min: 3, max: 8 },
        enabled: { type: Boolean, default: true }
    },
    // General Settings
    general: {
        adminName: { type: String, default: 'Administrator' },
        contactEmail: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        timeZone: { type: String, default: 'UTC' },
        emailNotifications: { type: Boolean, default: true },
        siteLogo: { type: String, default: '/images/logo-full.png' },
        siteLogoWidth: { type: Number, default: 150 }, // Width in pixels
        siteLogoHeight: { type: Number, default: 50 }, // Height in pixels
        siteFavIcon: { type: String, default: '/images/logo/favicon.ico' },
        siteSmallLogo: { type: String, default: '/images/logo-abbr.png' },
        siteSmallLogoWidth: { type: Number, default: 40 },
        siteSmallLogoHeight: { type: Number, default: 40 },
        digitalSignature: { type: String, default: '' },
        siteName: { type: String, default: 'Duralux Exam Portal' },
        seoTitle: { type: String, default: 'Online Exam System' },
        seoDescription: { type: String, default: 'Professional online examination platform' },
        examHeaderText: { type: String, default: 'Welcome to the Examination Portal' },
        examFooterText: { type: String, default: 'Good luck with your exam!' },
        showProgressBar: { type: Boolean, default: true },
        showQuestionNumbers: { type: Boolean, default: true },
        questionsPerPage: { type: Number, default: 1 }
    },
    autoRefreshInterval: { type: Number, default: 5000 }, // milliseconds
    maxConcurrentExams: { type: Number, default: 100 },

    // Integrations Settings  
    integrations: {
        googleOAuth: {
            enabled: { type: Boolean, default: false },
            clientId: { type: String, default: '' },
            clientSecret: { type: String, default: '' }
        },
        recaptcha: {
            enabled: { type: Boolean, default: false },
            siteKey: { type: String, default: '' },
            secretKey: { type: String, default: '' },
            version: { type: String, default: 'v2' }
        },
        localStorage: {
            enabled: { type: Boolean, default: true },
            maxImageSize: { type: Number, default: 10 }, // MB
            maxVideoSize: { type: Number, default: 100 }, // MB
            maxDocumentSize: { type: Number, default: 50 } // MB
        },
        razorpay: {
            enabled: { type: Boolean, default: false },
            keyId: { type: String, default: '' },
            keySecret: { type: String, default: '' },
            webhookSecret: { type: String, default: '' },
            webhookUrl: { type: String, default: '' },
            currency: { type: String, default: 'INR' }
        },
        phonepe: {
            enabled: { type: Boolean, default: false },
            merchantId: { type: String, default: '' },
            saltKey: { type: String, default: '' },
            saltIndex: { type: String, default: '1' },
            env: { type: String, default: 'UAT' } // UAT or PROD
        },
        offlinePayments: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: 'Please pay offline' }
        }
    },
    // Security Settings
    security: {
        enabled: { type: Boolean, default: true },
        maxLoginAttempts: { type: Number, default: 3 },
        lockoutDuration: { type: Number, default: 600 }, // seconds (10 minutes default)
        lockoutUnit: { type: String, default: 'minutes' } // 'seconds', 'minutes', 'hours'
    },
    // App Kill Switch
    appKillSwitch: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'This app version is no longer supported. Please update to the latest version.' },
        minRequiredVersion: { type: String, default: '1.0.0' },
        forceUpdate: { type: Boolean, default: false },
        blockedVersions: [{ type: String }], // Specific versions to block
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: 'App is under maintenance. Please try again later.' }
    },

    // WhatsApp Support Settings
    whatsappSupport: {
        phoneNumber: { type: String, default: '+919876543210' },
        message: { type: String, default: 'Hello, I need support with MD Consultancy app.' },
        enabled: { type: Boolean, default: true },
        primaryMethod: { type: String, default: 'whatsapp', enum: ['chat', 'whatsapp'] }
    },

    // Social Media Links
    socialMediaLinks: [{
        platform: { type: String, required: true }, // 'facebook', 'instagram', etc.
        url: { type: String, required: true },
        icon: { type: String }, // FontAwesome icon name or similar identifier
        enabled: { type: Boolean, default: true }
    }],

    // PDF Selfie Settings
    pdfSelfieSettings: {
        enabled: { type: Boolean, default: true },
        intervalInMinutes: { type: Number, default: 5 },
        captureOnStart: { type: Boolean, default: true },
        captureOnEnd: { type: Boolean, default: false }
    },

    // Authentication Settings - Platform Specific
    authSettings: {
        web: {
            enableRegistration: { type: Boolean, default: true },
            allowGoogleAuth: { type: Boolean, default: true },
            allowEmailAuth: { type: Boolean, default: true },
            enableForgotPassword: { type: Boolean, default: true }
        },
        app: {
            enableRegistration: { type: Boolean, default: true },
            enableMobileOTP: { type: Boolean, default: false },
            allowEmailAuth: { type: Boolean, default: true },
            allowGoogleAuth: { type: Boolean, default: true },
            enableForgotPassword: { type: Boolean, default: true }
        }
    },

    // Single instance - only one settings document
    singleton: { type: Boolean, default: true, unique: true }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
