import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import User from '../../../../../models/User'
import Settings from '../../../../../models/Settings'

// Helper function to generate roll number
async function generateRollNumber() {
    try {
        const settings = await Settings.findOne({});
        
        if (!settings || !settings.rollNumberSettings || !settings.rollNumberSettings.enabled) {
            return null; // Roll number generation disabled
        }

        const { prefix, currentNumber, digitLength } = settings.rollNumberSettings;
        
        // Format the number with leading zeros
        const formattedNumber = String(currentNumber).padStart(digitLength, '0');
        const rollNumber = `${prefix}${formattedNumber}`;
        
        // Increment current number for next user
        await Settings.updateOne(
            {},
            { $inc: { 'rollNumberSettings.currentNumber': 1 } }
        );
        
        return rollNumber;
    } catch (error) {
        console.error('Error generating roll number:', error);
        return null;
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        if (error) {
            return NextResponse.redirect(new URL(`/authentication/login?error=oauth_cancelled`, request.url))
        }
        
        if (!code) {
            return NextResponse.redirect(new URL(`/authentication/login?error=oauth_failed`, request.url))
        }

        // Get OAuth settings
        await connectDB()
        const db = require('mongoose').connection.db
        const settings = await db.collection('settings').findOne({})
        
        if (!settings?.integrations?.googleOAuth?.enabled) {
            return NextResponse.redirect(new URL(`/authentication/login?error=oauth_disabled`, request.url))
        }

        const { clientId, clientSecret } = settings.integrations.googleOAuth

        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
            })
        })

        const tokenData = await tokenResponse.json()
        
        if (!tokenData.access_token) {
            return NextResponse.redirect(new URL(`/authentication/login?error=token_failed`, request.url))
        }

        // Get user info from Google
        const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`)
        const userData = await userResponse.json()
        
        if (!userData.email) {
            return NextResponse.redirect(new URL(`/authentication/login?error=profile_failed`, request.url))
        }

        // Check if user exists
        let user = await User.findOne({ email: userData.email })
        
        if (!user) {
            // Generate roll number for new user
            const rollNumber = await generateRollNumber();
            
            // Create new user
            user = new User({
                name: userData.name || userData.email.split('@')[0],
                email: userData.email,
                password: '', // No password for OAuth users
                role: 'student', // Default role
                emailVerified: true, // Google email is already verified
                profilePicture: userData.picture || '',
                authProvider: 'google',
                googleId: userData.id,
                rollNumber: rollNumber // Assign roll number
            })
            await user.save()
        } else {
            // Update existing user
            user.authProvider = 'google'
            user.googleId = userData.id
            user.emailVerified = true
            if (userData.picture && !user.profilePicture) {
                user.profilePicture = userData.picture
            }
            await user.save()
        }

        // Create session or JWT token here
        // For now, redirect with user info in query params (not secure for production)
        const userInfo = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }

        // In production, you should create a proper session/JWT token
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('oauth_success', 'true')
        redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(userInfo)).toString('base64'))

        return NextResponse.redirect(redirectUrl)
        
    } catch (error) {
        console.error('Google OAuth callback error:', error)
        return NextResponse.redirect(new URL(`/authentication/login?error=oauth_error`, request.url))
    }
}