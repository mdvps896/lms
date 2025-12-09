'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/authentication/login')
      return
    }

    // If specific roles are required and user doesn't have permission
    if (!loading && isAuthenticated && allowedRoles.length > 0 && user) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect based on user role
        if (user.role === 'student') {
          router.push('/')
        } else {
          router.push('/unauthorized')
        }
      }
    }
  }, [isAuthenticated, loading, router, allowedRoles, user])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
