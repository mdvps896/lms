// Helper utilities for UserSelfiesModal

export const getSecureUrl = (filePath) => {
    if (!filePath) return ''
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return `/api/storage/secure-file?path=${encodeURIComponent(filePath)}`
    }
    // Reduce "/api/storage/file/uploads/x.jpg" → "/uploads/x.jpg" so it
    // resolves under public/ on the server.
    let normalizedPath = filePath.replace(/^\/api\/storage\/file\//, '/')
    if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath

    return `/api/storage/secure-file?path=${encodeURIComponent(normalizedPath)}`
}

export const filterSelfies = (selfies, activeTab, subTab) => {
    return selfies.filter(selfie => {
        const dummyId = '000000000000000000000000';
        // Check if it is a free material selfie
        // Our backend uses dummyId for course AND sets captureType.
        // Also check if course is 'free_material' string just in case.
        const isFreeMaterial =
            selfie.course === dummyId ||
            selfie.course?._id === dummyId ||
            selfie.courseName === 'Free Material' ||
            selfie.course === 'free_material' ||
            selfie.metadata?.isFreeMaterial === true;

        if (activeTab === 'courses') return !isFreeMaterial;
        if (activeTab === 'free_materials') {
            if (!isFreeMaterial) return false;

            const isTestSelfie = selfie.captureType?.startsWith('test_');
            if (subTab === 'test') return isTestSelfie;
            return !isTestSelfie; // Default to PDF for free_materials
        }
        return true;
    });
};
