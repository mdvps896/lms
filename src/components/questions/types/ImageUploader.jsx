import React, { useRef, useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

const ImageUploader = ({ value, onChange }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleClear = () => {
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="d-flex align-items-center gap-2">
            {uploading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Uploading...</span>
                </div>
            ) : value ? (
                <div className="position-relative">
                    <img 
                        src={value} 
                        alt="Option" 
                        style={{ height: '40px', width: 'auto', borderRadius: '4px', border: '1px solid #dee2e6' }} 
                    />
                    <button 
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle badge rounded-pill p-1"
                        style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={handleClear}
                    >
                        <FiX size={10} />
                    </button>
                </div>
            ) : (
                <div className="input-group input-group-sm">
                    <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
