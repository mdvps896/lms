// Pure helper functions for the storage page.

export const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
    if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
    if (['pdf'].includes(ext)) return 'pdf'
    return 'other'
}

export const filterAndSortFiles = (files, filters) => {
    let filtered = [...files]

    // Filter by type
    if (filters.type !== 'all') {
        filtered = filtered.filter(file => {
            // For exam recordings, check category first
            if (filters.type === 'exam-recording') {
                return file.category === 'exam-recording'
            }

            if (filters.type === 'free-material') {
                return file.category === 'free-material'
            }

            const fileType = file.type || getFileType(file.name)
            return fileType === filters.type
        })
    }

    // Filter by search
    if (filters.search) {
        filtered = filtered.filter(file => {
            const searchTerm = filters.search.toLowerCase()
            return (
                file.name.toLowerCase().includes(searchTerm) ||
                (file.examName && file.examName.toLowerCase().includes(searchTerm)) ||
                (file.studentName && file.studentName.toLowerCase().includes(searchTerm)) ||
                (file.recordingType && file.recordingType.toLowerCase().includes(searchTerm)) ||
                (file.recordingId && file.recordingId.toLowerCase().includes(searchTerm)) ||
                (file.cameraRecordingId && file.cameraRecordingId.toLowerCase().includes(searchTerm)) ||
                (file.screenRecordingId && file.screenRecordingId.toLowerCase().includes(searchTerm))
            )
        })
    }

    // Filter by date range
    if (filters.dateRange) {
        filtered = filtered.filter(file => {
            const fileDate = new Date(file.createdAt)
            return fileDate >= filters.dateRange.start && fileDate <= filters.dateRange.end
        })
    }

    // Sort files
    if (filters.sort) {
        filtered = [...filtered].sort((a, b) => {
            switch (filters.sort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'date-new':
                    return new Date(b.createdAt) - new Date(a.createdAt)
                case 'date-old':
                    return new Date(a.createdAt) - new Date(b.createdAt)
                case 'size-large':
                    return (b.size || 0) - (a.size || 0)
                case 'size-small':
                    return (a.size || 0) - (b.size || 0)
                default:
                    return 0
            }
        })
    }

    return filtered
}
