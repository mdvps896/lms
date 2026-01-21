import { sendEmail } from './email';
import mongoose from 'mongoose';
import connectDB from './mongodb';

/**
 * Send email notification to admin when a course is purchased
 * @param {Object} params - Purchase details
 * @param {Object} params.user - User object with name and email
 * @param {Object} params.course - Course object with title and price
 * @param {number} params.amount - Amount paid (0 for free)
 * @param {string} params.couponCode - Coupon code used (if any)
 * @param {boolean} params.isFree - Whether this is a free enrollment
 */
export const sendAdminPurchaseNotification = async ({ user, course, amount, couponCode, isFree }) => {
    try {
        await connectDB();

        // Get admin email from settings
        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});

        const adminEmail = settings?.general?.adminEmail;
        const siteName = settings?.general?.siteName || 'God of Graphics';

        if (!adminEmail) {
            return false;
        }

        // Format purchase type
        const purchaseType = isFree ? 'Free Enrollment' : 'Paid Purchase';
        const purchaseTypeBadge = isFree
            ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">FREE ENROLLMENT</span>'
            : '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">PAID PURCHASE</span>';

        // Format amount
        const amountDisplay = isFree ? 'Free (100% Coupon)' : `₹${amount.toFixed(2)}`;
        const originalPrice = course.price ? `₹${course.price.toFixed(2)}` : 'N/A';

        // Create email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Course Purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🎉 New Course Purchase!</h1>
                        </td>
                    </tr>
                    
                    <!-- Purchase Type Badge -->
                    <tr>
                        <td style="padding: 20px 30px 10px; text-align: center;">
                            ${purchaseTypeBadge}
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">A new course purchase has been completed on ${siteName}.</p>
                            
                            <!-- Student Information -->
                            <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                                <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">👤 Student Information</h3>
                                <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px; width: 120px;"><strong>Name:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${user.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px;"><strong>Email:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${user.email}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Course Information -->
                            <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                                <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">📚 Course Information</h3>
                                <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px; width: 120px;"><strong>Course Title:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${course.title}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px;"><strong>Original Price:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${originalPrice}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Payment Information -->
                            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                                <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">💳 Payment Information</h3>
                                <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px; width: 120px;"><strong>Amount Paid:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px; font-weight: 600;">${amountDisplay}</td>
                                    </tr>
                                    ${couponCode ? `
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px;"><strong>Coupon Used:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${couponCode}</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="color: #6b7280; font-size: 14px;"><strong>Purchase Time:</strong></td>
                                        <td style="color: #1f2937; font-size: 14px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/students" 
                                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    View Student Details
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                This is an automated notification from ${siteName}<br>
                                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        // Send email
        const subject = `🎉 New Course Purchase - ${course.title}`;
        const result = await sendEmail({
            to: adminEmail,
            subject,
            html: emailHtml
        });

        if (result) {
            } else {
            }

        return result;
    } catch (error) {
        console.error('❌ Error sending admin purchase notification:', error);
        return false;
    }
};
