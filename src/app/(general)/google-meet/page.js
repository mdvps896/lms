
'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import MeetingList from '@/components/google-meet/MeetingList'
import MeetingFilter from '@/components/google-meet/MeetingFilter'
import MeetingFormModal from '@/components/google-meet/MeetingFormModal'
import Swal from 'sweetalert2'

const GoogleMeetPage = () => {
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const [filteredMeetings, setFilteredMeetings] = useState([])
    const [filters, setFilters] = useState({
        search: '',
        category: null,
        startDate: null,
        endDate: null
    })

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedMeeting, setSelectedMeeting] = useState(null)

    // Fetch meetings
    const fetchMeetings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/meetings')
            const data = await response.json()
            if (data.success) {
                setMeetings(data.data)
                setFilteredMeetings(data.data)
            }
        } catch (error) {
            console.error('Error fetching meetings:', error)
            Swal.fire('Error', 'Failed to fetch meetings', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMeetings()
    }, [])

    // Apply filters
    useEffect(() => {
        let result = [...meetings]

        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase()
            result = result.filter(meet =>
                meet.title.toLowerCase().includes(term) ||
                (meet.category?.name && meet.category.name.toLowerCase().includes(term))
            )
        }

        // Category
        if (filters.category) {
            result = result.filter(meet => meet.category?._id === filters.category.value)
        }

        // Date Range
        if (filters.startDate) {
            result = result.filter(meet => new Date(meet.startTime) >= filters.startDate)
        }
        if (filters.endDate) {
            result = result.filter(meet => new Date(meet.startTime) <= filters.endDate)
        }

        setFilteredMeetings(result)
    }, [filters, meetings])

    // Handlers
    const handleCreate = () => {
        setSelectedMeeting(null)
        setIsFormOpen(true)
    }

    const handleEdit = (meeting) => {
        setSelectedMeeting(meeting)
        setIsFormOpen(true)
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Meeting?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
                if (response.ok) {
                    Swal.fire('Deleted!', 'Meeting has been deleted.', 'success')
                    fetchMeetings()
                } else {
                    Swal.fire('Error', 'Failed to delete meeting', 'error')
                }
            } catch (error) {
                Swal.fire('Error', 'Error deleting meeting', 'error')
            }
        }
    }

    return (
        <>
            <PageHeader
                title="Google Meet"
                breadcrumb={[
                    { name: 'Dashboard', path: '/' },
                    { name: 'Google Meet' }
                ]}
            />

            <div className="main-content">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card stretch stretch-full">
                            <div className="card-body p-0">
                                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                                    <h5 className="fw-bold mb-0">Meeting Schedule</h5>
                                    <button className="btn btn-primary" onClick={handleCreate}>
                                        <i className="feather-plus me-2"></i> New Meeting
                                    </button>
                                </div>

                                <MeetingFilter
                                    filters={filters}
                                    setFilters={setFilters}
                                />

                                <MeetingList
                                    meetings={filteredMeetings}
                                    loading={loading}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <MeetingFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    meeting={selectedMeeting}
                    onSave={() => {
                        setIsFormOpen(false)
                        fetchMeetings()
                    }}
                />
            )}
        </>
    )
}

export default GoogleMeetPage
