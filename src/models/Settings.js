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
        fontFamily: { type: String, default: 'Georgia, serif' }
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
    autoRefreshInterval: { type: Number, default: 5000 }, // milliseconds
    maxConcurrentExams: { type: Number, default: 100 },
    // Single instance - only one settings document
    singleton: { type: Boolean, default: true, unique: true }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
