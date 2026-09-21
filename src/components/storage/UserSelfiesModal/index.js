import React from 'react';
import useSelfiesActions from './useSelfiesActions';
import ModalHeader from './ModalHeader';
import ModalTabs from './ModalTabs';
import SelfieGrid from './SelfieGrid';
import ImagePreviewOverlay from './ImagePreviewOverlay';

const UserSelfiesModal = ({ user, show, onClose }) => {
    const {
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
    } = useSelfiesActions(user, show);

    if (!show || !user) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content" style={{ maxHeight: '90vh' }}>
                    <ModalHeader
                        user={user}
                        selfies={selfies}
                        filteredSelfies={filteredSelfies}
                        selectedIds={selectedIds}
                        deleting={deleting}
                        onToggleSelectAll={toggleSelectAll}
                        onExport={handleExport}
                        onDelete={handleDelete}
                        onClose={onClose}
                    />

                    <ModalTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        subTab={subTab}
                        setSubTab={setSubTab}
                    />

                    <div className="modal-body p-4 bg-light">
                        <SelfieGrid
                            loading={loading}
                            filteredSelfies={filteredSelfies}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onDelete={handleDelete}
                            onPreview={setSelectedImage}
                        />
                    </div>
                </div>
            </div>

            {/* Full Screen Image Preview Overlay */}
            <ImagePreviewOverlay
                selectedImage={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
};

export default UserSelfiesModal;
