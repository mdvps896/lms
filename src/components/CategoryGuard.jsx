'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import CategorySelectionModal from './students/CategorySelectionModal'

const CategoryGuard = ({ children }) => {
    const { user, refreshUser } = useAuth()
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        // Only check for students on non-auth pages
        if (user && user.role === 'student' && !user.category) {
            // Don't show modal on authentication pages
            const authPages = ['/authentication/login', '/authentication/register', '/authentication/forgot-password']
            if (!authPages.includes(pathname)) {
                setShowCategoryModal(true)
            }
        } else {
            setShowCategoryModal(false)
        }
    }, [user, pathname])

    const handleCategorySelected = async (categoryId) => {
        // Refresh user data to get updated category
        await refreshUser()
        setShowCategoryModal(false)
    }

    return (
        <>
            <CategorySelectionModal
                show={showCategoryModal}
                userId={user?._id}
                onCategorySelected={handleCategorySelected}
            />
            {children}
        </>
    )
}

export default CategoryGuard
