import { useState, useEffect } from 'react';
import { exportFilesAsZip } from '@/utils/exportUtils';
import Swal from 'sweetalert2';
import { filterSelfies } from './utils';

// Encapsulates all state and business logic for UserSelfiesModal.
export default function useSelfiesActions(user, show) {
    const [selfies, setSelfies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'courses', 'free_materials'
    const [subTab, setSubTab] = useState('pdf'); // 'pdf', 'test' - for free_materials

    useEffect(() => {
        if (show && user) {
            fetchSelfies();
            setSelectedImage(null);
            setSelectedIds([]);
            setActiveTab('all');
        }
    }, [show, user]);

    const fetchSelfies = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/storage/users/${user._id}/selfies`);
            const data = await response.json();
            if (data.success) {
                setSelfies(data.files);
            }
        } catch (error) {
            console.error('Error fetching selfies:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Filter Logic
    const filteredSelfies = filterSelfies(selfies, activeTab, subTab);

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSelfies.length && filteredSelfies.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSelfies.map(s => s._id));
        }
    };

    const handleExport = async (ids) => {
        const selectedSelfies = selfies.filter(s => ids.includes(s._id));

        try {
            Swal.fire({
                title: 'Preparing Export...',
                text: `Bundling ${ids.length} selfies.`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const exportData = selectedSelfies.map(s => ({
                path: s.imageUrl,
                name: `${user.name}_${s.courseName || 'selfie'}_${new Date(s.createdAt).getTime()}.jpg`
            }));

            await exportFilesAsZip(exportData, `${user.name}-selfies-${Date.now()}.zip`);

            Swal.fire({
                icon: 'success',
                title: 'Export Ready!',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'An error occurred while preparing the ZIP file.'
            });
        }
    };

    const handleDelete = async (ids) => {
        const result = await Swal.fire({
            title: 'Delete Selected Images?',
            text: `Are you sure you want to delete ${ids.length} image(s)?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            // Prepare items for deletion
            const itemsToDelete = ids.map(id => {
                const selfie = selfies.find(s => s._id === id);
                if (!selfie) return null;

                const isCloudinary = selfie.imagePath === 'cloudinary' || selfie.course === '000000000000000000000000';

                let publicId = null;
                if (isCloudinary && selfie.imageUrl) {
                    try {
                        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
                        const match = selfie.imageUrl.match(regex);
                        if (match && match[1]) {
                            publicId = match[1];
                        }
                    } catch (e) {
                        console.error('Failed to extract public ID', e);
                    }
                }

                return {
                    path: selfie.imagePath,
                    publicId: publicId,
                    isCloudinary: isCloudinary,
                    id: selfie._id // Include ID for accurate record deletion if needed
                };
            }).filter(item => item !== null);

            const response = await fetch('/api/storage/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToDelete })
            });

            const data = await response.json();
            if (data.success) {
                setSelfies(prev => prev.filter(s => !ids.includes(s._id)));
                setSelectedIds([]);
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: data.message || 'Images deleted successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: data.message || 'Failed to delete images'
                });
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while deleting'
            });
        } finally {
            setDeleting(false);
        }
    };

    return {
        selfies,
        loading,
        selectedImage,
        setSelectedImage,
        selectedIds,
        deleting,
        activeTab,
        setActiveTab,
        subTab,
        setSubTab,
        filteredSelfies,
        toggleSelect,
        toggleSelectAll,
        handleExport,
        handleDelete,
    };
}
