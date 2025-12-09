'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function RegistrationDebug() {
    const { isAuthenticated, loading, user } = useAuth()
    const [settings, setSettings] = useState(null)
    const [debugInfo, setDebugInfo] = useState({})

    useEffect(() => {
        // Fetch settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettings(data.data)
                    setDebugInfo(prev => ({
                        ...prev,
                        settingsLoaded: true,
                        enableRegistration: data.data.authPages?.enableRegistration,
                        authPages: data.data.authPages
                    }))
                }
            })
            .catch(err => {
                setDebugInfo(prev => ({
                    ...prev,
                    settingsError: err.message
                }))
            })
    }, [])

    useEffect(() => {
        setDebugInfo(prev => ({
            ...prev,
            isAuthenticated,
            loading,
            userExists: !!user,
            userId: user?.id || user?._id,
            userRole: user?.role
        }))
    }, [isAuthenticated, loading, user])

    return (
        <div style={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            background: '#000', 
            color: '#fff', 
            padding: '10px', 
            fontSize: '12px',
            borderRadius: '4px',
            maxWidth: '300px',
            zIndex: 9999
        }}>
            <h4>Registration Debug Info</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            <div>
                <strong>Current Path:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
            </div>
        </div>
    )
}