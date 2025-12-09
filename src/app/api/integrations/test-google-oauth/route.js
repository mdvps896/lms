import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { clientId, clientSecret } = await request.json()
        
        if (!clientId || !clientSecret) {
            return NextResponse.json({
                success: false,
                message: 'Client ID and Client Secret are required'
            }, { status: 400 })
        }

        // Test Google OAuth configuration by checking client_id format
        const clientIdPattern = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/
        if (!clientIdPattern.test(clientId)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid Client ID format. Should be like: 123-abc.apps.googleusercontent.com'
            }, { status: 400 })
        }

        // Test Google client secret format  
        const secretPattern = /^GOCSPX-[a-zA-Z0-9_-]+$/
        if (!secretPattern.test(clientSecret)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid Client Secret format. Should start with: GOCSPX-'
            }, { status: 400 })
        }

        // Try to make a simple request to Google's discovery endpoint
        try {
            const discoveryUrl = 'https://accounts.google.com/.well-known/openid-configuration'
            const discoveryResponse = await fetch(discoveryUrl)
            
            if (discoveryResponse.ok) {
                // If we can reach Google's OAuth endpoints, configuration format is valid
                return NextResponse.json({
                    success: true,
                    message: 'Google OAuth configuration format is valid and Google services are reachable'
                })
            } else {
                return NextResponse.json({
                    success: false,
                    message: 'Cannot reach Google OAuth services'
                }, { status: 400 })
            }
        } catch (networkError) {
            return NextResponse.json({
                success: false,
                message: 'Network error while testing Google OAuth connection'
            }, { status: 500 })
        }
        
    } catch (error) {
        console.error('Google OAuth test error:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to test Google OAuth configuration: ' + error.message
        }, { status: 500 })
    }
}