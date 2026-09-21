import React, { useState } from 'react';

const SelfieImage = ({ src }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-100 h-100 bg-white d-flex align-items-center justify-content-center">
                <i className="fas fa-camera fa-2x text-muted opacity-25"></i>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt="Selfie"
            className="w-100 h-100 object-fit-cover transition-transform hover:scale-110"
            style={{ cursor: 'zoom-in', objectFit: 'cover' }}
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

export default SelfieImage;
