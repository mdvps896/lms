import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import connectDB from '../../../lib/mongodb';

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request) {
    try {
        const { email, name } = await request.json();

        // Fetch site settings to get site name and SMTP settings
        let siteName = 'Exam Portal';
        let smtpSettings = null;
        
        try {
            await connectDB();
            const db = require('mongoose').connection.db;
            const settings = await db.collection('settings').findOne({});
            if (settings) {
                if (settings.general && settings.general.siteName) {
                    siteName = settings.general.siteName;
                }
                if (settings.securitySMTP && settings.securitySMTP.smtp) {
                    smtpSettings = settings.securitySMTP.smtp;
                }
            }
        } catch (settingsError) {
            console.log('Could not fetch site settings, using defaults');
        }

        // Validate email provider
        const validProviders = [
            'gmail.com',
            'yahoo.com', 'yahoo.co.in',
            'outlook.com', 'hotmail.com', 'live.com',
            'icloud.com', 'me.com', 'mac.com'
        ];
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!validProviders.includes(domain)) {
            return NextResponse.json(
                { success: false, message: 'Please use Gmail, Yahoo, Outlook/Bing, or Apple email' },
                { status: 400 }
            );
        }

        // Generate OTP
        const otp = generateOTP();

        // Create transporter using settings SMTP or fallback to env
        let transporter;
        if (smtpSettings && smtpSettings.smtpHost && smtpSettings.smtpUsername && smtpSettings.smtpPassword) {
            transporter = nodemailer.createTransport({
                host: smtpSettings.smtpHost,
                port: smtpSettings.smtpPort || 587,
                secure: smtpSettings.smtpPort == 465 ? true : smtpSettings.smtpSecure,
                auth: {
                    user: smtpSettings.smtpUsername,
                    pass: smtpSettings.smtpPassword
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } else {
            // Fallback to environment variables
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        }

        // Determine from email and name
        const fromEmail = (smtpSettings && smtpSettings.fromEmail) || process.env.SMTP_EMAIL;
        const fromName = (smtpSettings && smtpSettings.fromName) || siteName;

        // Email template
        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: `Email Verification - ${siteName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #333;
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        .content p {
                            color: #666;
                            line-height: 1.6;
                            margin-bottom: 20px;
                        }
                        .otp-box {
                            background: #f8f9fa;
                            border: 2px dashed #667eea;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                            margin: 30px 0;
                        }
                        .otp-code {
                            font-size: 36px;
                            font-weight: bold;
                            color: #667eea;
                            letter-spacing: 8px;
                            margin: 10px 0;
                        }
                        .otp-label {
                            color: #888;
                            font-size: 14px;
                            text-transform: uppercase;
                            margin-bottom: 10px;
                        }
                        .warning {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            color: #856404;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #888;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 ${siteName}</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${name}!</h2>
                            <p>Thank you for registering with ${siteName}. To complete your registration, please verify your email address.</p>
                            
                            <div class="otp-box">
                                <div class="otp-label">Your Verification Code</div>
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p>Enter this 6-digit code on the verification page to activate your account.</p>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong><br>
                                This code will expire in 10 minutes. Never share this code with anyone. Our team will never ask for this code.
                            </div>

                            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 ${siteName}. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Store OTP in session/memory (in production, use Redis or database)
        // For now, return OTP to client (only for development)
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            otp: otp, // Remove this in production
            expiresIn: 600000 // 10 minutes
        });

    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send OTP', error: error.message },
            { status: 500 }
        );
    }
}
