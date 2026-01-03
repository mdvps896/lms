import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import connectDB from './mongodb';

/**
 * Generic email sending utility
 * Fetches SMTP settings from the database
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        await connectDB();

        // Fetch SMTP settings from the database
        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});

        if (!settings || !settings.securitySMTP || !settings.securitySMTP.smtp) {
            console.error('❌ SMTP settings not found in database');
            return false;
        }

        const {
            smtpHost,
            smtpPort,
            smtpUsername,
            smtpPassword,
            smtpSecure,
            fromEmail,
            fromName
        } = settings.securitySMTP.smtp;

        if (!smtpHost || !smtpUsername || !smtpPassword) {
            console.error('❌ Incomplete SMTP configuration');
            return false;
        }

        const siteName = settings.general?.siteName || 'Exam Portal';

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort) || 587,
            secure: smtpPort === 465 ? true : (smtpSecure || false),
            auth: {
                user: smtpUsername,
                pass: smtpPassword,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Send mail
        const info = await transporter.sendMail({
            from: `"${fromName || siteName}" <${fromEmail || smtpUsername}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Simple html to text fallback
        });

        console.log(`✅ Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};
