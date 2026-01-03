'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import FreeMaterialList from '@/components/free-materials/FreeMaterialList'
import FreeMaterialFormModal from '@/components/free-materials/FreeMaterialFormModal'
import Swal from 'sweetalert2'

const FreeMaterialsPage = () => {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedMaterial, setSelectedMaterial] = useState(null)

    const fetchMaterials = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/free-materials')
            const data = await response.json()
            if (data.success) {
                setMaterials(data.data)
            }
        } catch (error) {
            console.error('Error fetching materials:', error)
            Swal.fire('Error', 'Failed to fetch free materials', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMaterials()
    }, [])

    const handleCreate = () => {
        setSelectedMaterial(null)
        setIsFormOpen(true)
    }

    const handleEdit = (material) => {
        setSelectedMaterial(material)
        setIsFormOpen(true)
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Material?',
            text: "You won't be able to revert this! All attached files will be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/free-materials/${id}`, { method: 'DELETE' })
                if (response.ok) {
                    Swal.fire('Deleted!', 'Material has been deleted.', 'success')
                    fetchMaterials()
                } else {
                    Swal.fire('Error', 'Failed to delete material', 'error')
                }
            } catch (error) {
                Swal.fire('Error', 'Error deleting material', 'error')
            }
        }
    }

    return (
        <>
            <PageHeader
                title="Free Materials"
                breadcrumb={[
                    { name: 'Dashboard', path: '/' },
                    { name: 'Free Materials' }
                ]}
            />

            <div className="main-content">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card stretch stretch-full">
                            <div className="card-body p-0">
                                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                                    <h5 className="fw-bold mb-0">Study Materials</h5>
                                    <button className="btn btn-primary" onClick={handleCreate}>
                                        <i className="feather-plus me-2"></i> Add Material
                                    </button>
                                </div>

                                <FreeMaterialList
                                    materials={materials}
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
                <FreeMaterialFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    material={selectedMaterial}
                    onSave={() => {
                        setIsFormOpen(false)
                        fetchMaterials()
                    }}
                />
            )}
        </>
    )
}

export default FreeMaterialsPage
