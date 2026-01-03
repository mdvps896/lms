import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { gateway, amount } = await request.json();

        if (!gateway || !amount) {
            return NextResponse.json({ success: false, error: 'Gateway and Amount are required' }, { status: 400 });
        }

        await connectDB();
        const db = require('mongoose').connection.db;
        const settingsDoc = await db.collection('settings').findOne({});

        if (!settingsDoc || !settingsDoc.integrations) {
            return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 404 });
        }

        const integrations = settingsDoc.integrations;

        if (gateway === 'razorpay') {
            const config = integrations.razorpay;
            if (!config || !config.enabled || !config.keyId || !config.keySecret) {
                return NextResponse.json({ success: false, error: 'Razorpay is not enabled or configured' }, { status: 400 });
            }

            const razorpay = new Razorpay({
                key_id: config.keyId,
                key_secret: config.keySecret,
            });

            const options = {
                amount: Math.round(amount * 100), // amount in paisa
                currency: config.currency || 'INR',
                receipt: `receipt_test_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);
            return NextResponse.json({
                success: true,
                data: {
                    ...order,
                    key_id: config.keyId // needed for frontend
                }
            });

        }

        return NextResponse.json({ success: false, error: 'Invalid gateway selected' }, { status: 400 });

    } catch (error) {
        console.error('Test Payment API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
