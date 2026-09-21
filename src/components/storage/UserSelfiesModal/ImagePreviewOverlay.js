import React from 'react';
import { getSecureUrl } from './utils';

const ImagePreviewOverlay = ({ selectedImage, onClose }) => {
    if (!selectedImage) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.9)' }}
            onClick={onClose}
        >
            <button
                className="btn btn-close btn-close-white position-absolute top-0 end-0 m-4"
                onClick={onClose}
            ></button>
            <img
                src={getSecureUrl(selectedImage.imageUrl)}
                alt="Full View"
                style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                className="rounded shadow-lg"
            />
            <div className="position-absolute bottom-0 text-white p-3 text-center bg-black bg-opacity-50 w-100">
                <p className="mb-0 fw-bold">Captured: {new Date(selectedImage.createdAt).toLocaleString()}</p>
                <p className="mb-0 small text-white-50">{selectedImage.captureType} • {selectedImage.courseName}</p>
            </div>
        </div>
    );
};

export default ImagePreviewOverlay;
