'use client'
import React from 'react'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import MyExamsContainer from '@/components/students/exams/MyExamsContainer'

const MyExamsPage = () => {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <MyExamsContainer />
        </ProtectedRoute>
    )
}

export default MyExamsPage