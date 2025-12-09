'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'

const GoogleRecaptcha = ({ onVerify, onError }) => {
    const [siteKey, setSiteKey] = useState('')
    const [isEnabled, setIsEnabled] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Fetch reCAPTCHA settings
        const fetchRecaptchaSettings = async () => {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                
                if (data.success && data.data.integrations?.recaptcha?.enabled) {
                    setSiteKey(data.data.integrations.recaptcha.siteKey)
                    setIsEnabled(true)
                }
            } catch (error) {
                console.error('Error fetching reCAPTCHA settings:', error)
            }
        }

        fetchRecaptchaSettings()
    }, [])

    useEffect(() => {
        if (isLoaded && isEnabled && siteKey && window.grecaptcha) {
            // Initialize reCAPTCHA v3
            window.grecaptcha.ready(() => {
                console.log('reCAPTCHA v3 ready')
            })
        }
    }, [isLoaded, isEnabled, siteKey])

    const executeRecaptcha = async (action = 'submit') => {
        if (!isEnabled || !siteKey || !window.grecaptcha) {
            // If reCAPTCHA is disabled, return success
            return { success: true, token: null }
        }

        try {
            const token = await window.grecaptcha.execute(siteKey, { action })
            
            // Verify token on server
            const response = await fetch('/api/auth/verify-recaptcha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, action })
            })

            const result = await response.json()
            
            if (result.success) {
                if (onVerify) onVerify(token, result.score)
                return { success: true, token, score: result.score }
            } else {
                if (onError) onError(result.message || 'reCAPTCHA verification failed')
                return { success: false, error: result.message }
            }
        } catch (error) {
            console.error('reCAPTCHA error:', error)
            if (onError) onError('reCAPTCHA verification failed')
            return { success: false, error: error.message }
        }
    }

    // Make executeRecaptcha available globally
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.executeRecaptcha = executeRecaptcha
        }
    }, [executeRecaptcha])

    if (!isEnabled || !siteKey) {
        return null
    }

    return (
        <>
            <Script
                src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    console.error('Failed to load reCAPTCHA script')
                    if (onError) onError('Failed to load reCAPTCHA')
                }}
            />
            
            {/* Add reCAPTCHA branding notice */}
            <div className="text-muted small mt-2" style={{ fontSize: '11px' }}>
                This site is protected by reCAPTCHA and the Google{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    Privacy Policy
                </a>{' '}
                and{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    Terms of Service
                </a>{' '}
                apply.
            </div>
        </>
    )
}

export default GoogleRecaptcha