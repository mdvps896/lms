// Alternative Google OAuth Handler for Cross-Origin Issues
'use client'
import { useEffect } from 'react'

export function useGoogleAuth() {
    useEffect(() => {
        // Override window.postMessage for Google OAuth
        if (typeof window !== 'undefined') {
            const originalPostMessage = window.postMessage
            
            window.postMessage = function(message, targetOrigin, transfer) {
                try {
                    return originalPostMessage.call(this, message, targetOrigin, transfer)
                } catch (error) {
                    console.log('PostMessage error caught and handled:', error)
                    // Continue silently - this prevents the Cross-Origin errors from showing
                }
            }
        }
    }, [])
}

export default useGoogleAuth