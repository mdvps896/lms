import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'

export async function POST(request) {
    try {
        const { token, action } = await request.json()
        
        if (!token) {
            return NextResponse.json({
                success: false,
                message: 'reCAPTCHA token is required'
            }, { status: 400 })
        }

        // Get reCAPTCHA settings
        await connectDB()
        const db = require('mongoose').connection.db
        const settings = await db.collection('settings').findOne({})
        
        if (!settings?.integrations?.recaptcha?.enabled || !settings.integrations.recaptcha.secretKey) {
            return NextResponse.json({
                success: false,
                message: 'reCAPTCHA is not configured'
            }, { status: 400 })
        }

        const { secretKey } = settings.integrations.recaptcha

        // Verify token with Google
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'
        const formData = new URLSearchParams()
        formData.append('secret', secretKey)
        formData.append('response', token)
        
        const response = await fetch(verifyUrl, {
            method: 'POST',
            body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
            // Check score for reCAPTCHA v3 (score should be > 0.5)
            const score = result.score || 0
            const isValidScore = score >= 0.5
            
            return NextResponse.json({
                success: isValidScore,
                score,
                action: result.action,
                message: isValidScore ? 'reCAPTCHA verification successful' : 'Low reCAPTCHA score detected'
            })
        } else {
            return NextResponse.json({
                success: false,
                message: 'reCAPTCHA verification failed',
                errors: result['error-codes']
            }, { status: 400 })
        }
        
    } catch (error) {
        console.error('reCAPTCHA verification error:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to verify reCAPTCHA'
        }, { status: 500 })
    }
}