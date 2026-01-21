import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '../../../lib/mongodb';

export async function POST(request) {
    try {
        const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpSecure, fromEmail, fromName, testEmail } = await request.json();

        // Validate required fields
        if (!smtpHost || !smtpUsername || !smtpPassword || !fromEmail || !testEmail) {
            return NextResponse.json({
                success: false,
                message: 'Missing required SMTP configuration or test email address'
            }, { status: 400 });
        }

        // Fetch site settings to get site name
        let siteName = 'Exam Portal';
        try {
            await connectDB();
            const db = require('mongoose').connection.db;
            const settings = await db.collection('settings').findOne({});
            if (settings && settings.general && settings.general.siteName) {
                siteName = settings.general.siteName;
            }
        } catch (settingsError) {
            }

        // Parse options ensuring correct types
        const port = parseInt(smtpPort) || 587;
        // Logic: Force secure=true for 465, otherwise rely on the passed flag or default to false
        // Note: secure: false means "use STARTTLS" (upgrade later), which is correct for 587
        const isSecure = port === 465 ? true : (Boolean(smtpSecure) || false);

        // Create transporter with improved configuration
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: port,
            secure: isSecure,
            auth: {
                user: smtpUsername,
                pass: smtpPassword,
            },
            tls: {
                rejectUnauthorized: false, // Allow self-signed certificates
                ciphers: 'SSLv3' // Sometimes helps with legacy servers
            },
            debug: process.env.NODE_ENV === 'development', // Show debug output in logs
            logger: process.env.NODE_ENV === 'development', // Log information to console
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        const info = await transporter.sendMail({
            from: `"${fromName || siteName}" <${fromEmail}>`,
            to: testEmail,
            subject: `SMTP Test Email - ${siteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0d6efd; margin-bottom: 20px;">SMTP Configuration Test</h2>
                    <p>Hello,</p>
                    <p>This is a test email to verify your SMTP configuration for the ${siteName}.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4>SMTP Settings Used:</h4>
                        <ul>
                            <li><strong>Host:</strong> ${smtpHost}</li>
                            <li><strong>Port:</strong> ${smtpPort || 587}</li>
                            <li><strong>Security:</strong> ${smtpSecure ? 'Enabled (SSL/TLS)' : 'Disabled'}</li>
                            <li><strong>From Email:</strong> ${fromEmail}</li>
                            <li><strong>From Name:</strong> ${fromName || siteName}</li>
                        </ul>
                    </div>
                    <p style="color: #28a745; font-weight: bold;">✓ Your SMTP configuration is working correctly!</p>
                    <p>You can now use these settings to send emails from your exam portal.</p>
                    <hr style="margin: 30px 0;">
                    <p style="color: #6c757d; font-size: 14px;">
                        This email was sent automatically by the ${siteName} settings test feature.<br>
                        Time: ${new Date().toLocaleString()}
                    </p>
                </div>
            `,
            text: `
SMTP Configuration Test - ${siteName}

Hello,

This is a test email to verify your SMTP configuration for the ${siteName}.

SMTP Settings Used:
- Host: ${smtpHost}
- Port: ${smtpPort || 587}
- Security: ${smtpSecure ? 'Enabled (SSL/TLS)' : 'Disabled'}
- From Email: ${fromEmail}
- From Name: ${fromName || siteName}

✓ Your SMTP configuration is working correctly!

You can now use these settings to send emails from your exam portal.

This email was sent automatically by the ${siteName} settings test feature.
Time: ${new Date().toLocaleString()}
            `
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent successfully to ${testEmail}! Message ID: ${info.messageId}`
        });

    } catch (error) {
        console.error('SMTP Test Error:', error);

        let errorMessage = 'Failed to send test email';

        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your username and password.';
        } else if (error.code === 'ECONNECTION' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection failed. Please check your SMTP host and port settings.';
        } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Network connection timeout. Please check your internet connection and firewall settings.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'SMTP host not found. Please verify the SMTP server address.';
        } else if (error.code === 'EENVELOPE') {
            errorMessage = 'Invalid email address. Please check the from/to email addresses.';
        } else if (error.responseCode === 535) {
            errorMessage = 'Authentication failed. For Gmail, use App Password instead of regular password.';
        } else if (error.responseCode === 587 || error.responseCode === 465) {
            errorMessage = 'Port configuration error. Try port 587 with STARTTLS or port 465 with SSL.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({
            success: false,
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        }, { status: 500 });
    }
}