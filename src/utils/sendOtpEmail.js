// Email utility for sending OTP verification emails
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get site name from database using existing mongodb connection
const getSiteName = async () => {
    try {
        const connectDB = await import('@/lib/mongodb');
        await connectDB.default();
        
        // Use mongoose to get settings like other parts of the app
        const mongoose = require('mongoose');
        const settingsCollection = mongoose.connection.db.collection('settings');
        const settings = await settingsCollection.findOne({});
        
        console.log('Fetched settings for email:', settings?.general?.siteName);
        
        if (settings?.general?.siteName) {
            return settings.general.siteName;
        }
        return 'my exam'; // Fallback to your current site name
    } catch (error) {
        console.warn('Could not fetch site name from database:', error.message);
        return 'my exam'; // Fallback to your current site name
    }
};

// Send OTP email using Gmail SMTP
export const sendOtpEmail = async (recipientEmail, recipientName, otp, emailType = 'registration') => {
    try {
        // Get site name from database
        const siteName = await getSiteName();

        // Create transporter with Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Determine email content based on type
        let subject, bodyContent, headerTitle;
        
        if (emailType === 'Password Reset' || emailType === 'reset') {
            subject = `Password Reset - ${siteName}`;
            headerTitle = `🔑 Password Reset - ${siteName}`;
            bodyContent = `
                <h2>Hello!</h2>
                <p>You have requested to reset your password for your ${siteName} account. Please use the verification code below to proceed.</p>
                
                <div class="otp-box">
                    <div class="otp-label">Password Reset Code</div>
                    <div class="otp-code">${otp}</div>
                </div>

                <p>Enter this 6-digit code to reset your password.</p>

                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    This code will expire in 10 minutes. Never share this code with anyone. If you didn't request a password reset, please ignore this email.
                </div>

                <p>If you need help, please contact our support team.</p>
            `;
        } else if (emailType === 'Two-Factor Authentication' || emailType.includes('Two-Factor')) {
            subject = `Two-Factor Authentication - ${siteName}`;
            headerTitle = `🔐 Two-Factor Authentication`;
            bodyContent = `
                <h2>Hello ${recipientName || 'there'}!</h2>
                <p>You are logging into your ${siteName} admin account. For your security, please verify your identity with the code below.</p>
                
                <div class="otp-box">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                </div>

                <p>Enter this 6-digit code to complete your login.</p>

                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    This code will expire in 10 minutes. Never share this code with anyone. If you didn't try to login, please contact support immediately.
                </div>

                <p>This login attempt was from your registered device. If this wasn't you, please secure your account immediately.</p>
            `;
        } else {
            subject = `Email Verification - ${siteName}`;
            headerTitle = `🔐 ${siteName}`;
            bodyContent = `
                <h2>Hello ${recipientName || 'there'}!</h2>
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
            `;
        }

        // Email template
        const mailOptions = {
            from: `"${siteName}" <${process.env.SMTP_EMAIL}>`,
            to: recipientEmail,
            subject: subject,
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
                            <h1>${headerTitle}</h1>
                        </div>
                        <div class="content">
                            ${bodyContent}
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
        return { success: true, message: 'OTP sent successfully' };

    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, message: 'Failed to send OTP email', error: error.message };
    }
};

// Validate email domain
export const isValidEmailProvider = (email) => {
    const validProviders = [
        'gmail.com',
        'yahoo.com', 'yahoo.co.in',
        'outlook.com', 'hotmail.com', 'live.com', // Microsoft/Bing
        'icloud.com', 'me.com', 'mac.com' // Apple
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return validProviders.includes(domain);
};
