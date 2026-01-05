import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-registration-enabled
 * Check if user registration is enabled in settings
 */
export async function GET() {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});



        const registrationEnabled =
            settings?.authPages?.enableRegistration === true ||
            settings?.loginRegister?.enableUserRegistration === true ||
            settings?.general?.enableRegistration === true ||
            false;



        return NextResponse.json({
            success: true,
            registrationEnabled
        });

    } catch (error) {
        console.error('❌ Check Registration Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
            registrationEnabled: false
        }, { status: 500 });
    }
}
