'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import ProfileInfoForm from './_components/ProfileInfoForm'
import ProfileSidebar from './_components/ProfileSidebar'

const ProfilePage = () => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        username: user?.username || ''
    })
    const [loading, setLoading] = useState(false)
    const [imageLoading, setImageLoading] = useState(false)
    const [categoryData, setCategoryData] = useState(null)
    const [subjects, setSubjects] = useState([])
    const [categoryLoading, setCategoryLoading] = useState(false)

    useEffect(() => {
        if (user?.role === 'student') {
            fetchCategoryAndSubjects()
        }
    }, [user])

    const fetchCategoryAndSubjects = async () => {
        setCategoryLoading(true)
        try {
            const response = await fetch('/api/users/category-subjects')
            const data = await response.json()

            if (data.success) {
                setCategoryData(data.data.category)
                setSubjects(data.data.subjects)
            }
        } catch (error) {
            console.error('Error fetching category and subjects:', error)
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone
                })
            })

            const data = await response.json()

            if (data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, ...formData }
                localStorage.setItem('user', JSON.stringify(updatedUser))

                toast.success('Profile updated successfully!')
            } else {
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        setImageLoading(true)

        try {
            const formData = new FormData()
            formData.append('profileImage', file)

            const response = await fetch('/api/users/upload-profile-image', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, profileImage: data.imageUrl }
                localStorage.setItem('user', JSON.stringify(updatedUser))

                toast.success('Profile image updated successfully!')
                window.location.reload() // Refresh to show new image
            } else {
                toast.error(data.message || 'Failed to upload image')
            }
        } catch (error) {
            console.error('Image upload error:', error)
            toast.error('Failed to upload image')
        } finally {
            setImageLoading(false)
        }
    }

    return (
        <div className="nxl-content">
            <div className="page-header">
                <div className="page-header-left d-flex align-items-center">
                    <div className="page-header-title">
                        <h5 className="m-b-10">My Profile</h5>
                    </div>
                    <ul className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/">Home</a></li>
                        <li className="breadcrumb-item">My Profile</li>
                    </ul>
                </div>
            </div>

            <div className="main-content">
                <div className="row">
                    <ProfileInfoForm
                        user={user}
                        formData={formData}
                        loading={loading}
                        imageLoading={imageLoading}
                        handleInputChange={handleInputChange}
                        handleProfileUpdate={handleProfileUpdate}
                        handleImageUpload={handleImageUpload}
                    />

                    <ProfileSidebar
                        user={user}
                        categoryLoading={categoryLoading}
                        categoryData={categoryData}
                        subjects={subjects}
                    />
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
