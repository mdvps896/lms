import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDF from '@/models/PDF';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import crypto from 'crypto';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pdfs/purchase
 * Purchase a premium PDF
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            pdfId,
            userId,
            amount
        } = body;

        console.log(`💳 [PDF Purchase] Start - PDF: ${pdfId}, User: ${userId}, Amount: ${amount}`);

        await connectDB();

        // Verify Razorpay signature
        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});
        const keySecret = settings?.integrations?.razorpay?.keySecret;

        if (!keySecret) {
            return NextResponse.json({
                success: false,
                message: 'Payment configuration missing'
            }, { status: 500 });
        }

        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.error('❌ Signature mismatch!');
            return NextResponse.json({
                success: false,
                message: 'Invalid payment signature'
            }, { status: 400 });
        }

        console.log('✅ Payment Signature Verified');

        // Get PDF and User
        const pdf = await PDF.findById(pdfId);
        const user = await User.findById(userId);

        if (!pdf || !user) {
            return NextResponse.json({
                success: false,
                message: 'PDF or User not found'
            }, { status: 404 });
        }

        // Check if already purchased
        const alreadyPurchased = pdf.purchasedBy.some(
            p => p.user.toString() === userId.toString()
        );

        if (alreadyPurchased) {
            return NextResponse.json({
                success: false,
                message: 'PDF already purchased'
            }, { status: 400 });
        }

        // Add to purchasedBy array
        pdf.purchasedBy.push({
            user: userId,
            purchasedAt: new Date(),
            amount: amount
        });

        await pdf.save();

        // Create Payment Record
        await Payment.create({
            user: userId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: amount,
            originalPrice: pdf.price,
            status: 'success',
            metadata: {
                type: 'pdf_purchase',
                pdfId: pdfId,
                pdfName: pdf.name
            }
        });

        console.log(`✅ PDF Purchase Complete - ${pdf.name}`);

        // Send Notification
        try {
            await Notification.create({
                title: '📄 PDF Purchased!',
                message: `You have successfully purchased "${pdf.name}". You can now access it anytime.`,
                type: 'pdf_purchase',
                createdBy: userId,
                recipients: [{ userId: userId }],
                data: {
                    pdfId: pdf._id.toString(),
                    pdfName: pdf.name
                }
            });

            // Send push notification if FCM token exists
            if (user.fcmToken) {
                const admin = (await import('firebase-admin')).default;

                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        }),
                    });
                }

                const message = {
                    notification: {
                        title: '📄 PDF Purchased!',
                        body: `You have successfully purchased "${pdf.name}".`,
                    },
                    data: {
                        type: 'pdf_purchase',
                        pdfId: pdf._id.toString(),
                        pdfName: pdf.name,
                    },
                    token: user.fcmToken,
                    android: {
                        priority: 'high',
                        notification: {
                            icon: '@mipmap/launcher_icon',
                            color: '#FF0000',
                            channelId: 'high_importance_channel',
                            sound: 'default',
                        },
                    },
                };

                await admin.messaging().send(message);
                console.log('📬 Purchase notification sent');
            }
        } catch (notifError) {
            console.error('❌ Notification error:', notifError.message);
        }

        return NextResponse.json({
            success: true,
            message: 'PDF purchased successfully',
            pdf: {
                _id: pdf._id,
                name: pdf.name,
                fileUrl: pdf.fileUrl
            }
        });

    } catch (error) {
        console.error('❌ PDF Purchase Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
