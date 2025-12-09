import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { siteKey, secretKey } = await request.json()
        
        if (!siteKey || !secretKey) {
            return NextResponse.json({
                success: false,
                message: 'Site Key and Secret Key are required'
            }, { status: 400 })
        }

        // Check reCAPTCHA keys format
        // Site key format: 6Lc... (40 chars)
        if (!/^6L[a-zA-Z0-9_-]{38}$/.test(siteKey)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid Site Key format. Should start with "6L" and be 40 characters long'
            }, { status: 400 })
        }

        // Secret key format: 6L... (40 chars) 
        if (!/^6L[a-zA-Z0-9_-]{38}$/.test(secretKey)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid Secret Key format. Should start with "6L" and be 40 characters long'
            }, { status: 400 })
        }

        // Test reCAPTCHA by making a dummy verification request
        try {
            const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'
            const formData = new URLSearchParams()
            formData.append('secret', secretKey)
            formData.append('response', 'test-token-will-fail-but-validates-secret')
            
            const response = await fetch(verifyUrl, {
                method: 'POST',
                body: formData
            })
            
            if (response.ok) {
                const result = await response.json()
                
                // Even if the test token fails, if we get a proper response structure
                // it means the secret key is in valid format and reachable
                if (result.hasOwnProperty('success')) {
                    return NextResponse.json({
                        success: true,
                        message: 'reCAPTCHA configuration keys are in valid format and Google reCAPTCHA service is reachable'
                    })
                }
            }
            
            return NextResponse.json({
                success: false,
                message: 'Cannot reach Google reCAPTCHA verification service'
            }, { status: 400 })
            
        } catch (networkError) {
            return NextResponse.json({
                success: false,
                message: 'Network error while testing reCAPTCHA connection'
            }, { status: 500 })
        }
        
    } catch (error) {
        console.error('reCAPTCHA test error:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to test reCAPTCHA configuration: ' + error.message
        }, { status: 500 })
    }
}