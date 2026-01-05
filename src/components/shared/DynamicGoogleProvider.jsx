'use client'
import { useState, useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

const DynamicGoogleProvider = ({ children }) => {
    const [googleClientId, setGoogleClientId] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGoogleSettings = async () => {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()

                if (data.success && data.data.integrations?.googleOAuth?.clientId) {

                    setGoogleClientId(data.data.integrations.googleOAuth.clientId)
                } else {
                    console.log('No Google OAuth settings found in database')
                    // Don't fallback to env - only use database settings
                }
            } catch (error) {
                console.error('Error fetching Google settings:', error)
                // Don't fallback to env on error - only use database
            } finally {
                setLoading(false)
            }
        }

        fetchGoogleSettings()
    }, [])

    // Show loading or children without Google OAuth if no client ID
    if (loading || !googleClientId) {
        return <>{children}</>
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    )
}

export default DynamicGoogleProvider