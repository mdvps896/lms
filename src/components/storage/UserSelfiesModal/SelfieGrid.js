import React from 'react';
import SelfieCard from './SelfieCard';

const SelfieGrid = ({ loading, filteredSelfies, selectedIds, onToggleSelect, onDelete, onPreview }) => {
    if (loading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (filteredSelfies.length === 0) {
        return (
            <div className="text-center p-5">
                <i className="fas fa-camera-retro fa-3x text-muted mb-3"></i>
                <p className="text-muted">No selfies found for this view.</p>
            </div>
        );
    }

    return (
        <div className="row g-3">
            {filteredSelfies.map((selfie) => (
                <SelfieCard
                    key={selfie._id}
                    selfie={selfie}
                    isSelected={selectedIds.includes(selfie._id)}
                    onToggleSelect={onToggleSelect}
                    onDelete={onDelete}
                    onPreview={onPreview}
                />
            ))}
        </div>
    );
};

export default SelfieGrid;
