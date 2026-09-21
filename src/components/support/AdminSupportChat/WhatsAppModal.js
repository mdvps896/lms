'use client'

import React from 'react'
import { FaWhatsapp } from 'react-icons/fa'

const WhatsAppModal = ({
    showWhatsAppModal,
    setShowWhatsAppModal,
    tempNumber,
    setTempNumber,
    tempMessage,
    setTempMessage,
    handleSaveWhatsAppSettings,
    handleSendWhatsApp
}) => {
    if (!showWhatsAppModal) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title d-flex align-items-center gap-2">
                            <FaWhatsapp size={24} className="text-success" />
                            WhatsApp Support
                        </h5>
                        <button type="button" className="btn-close" onClick={() => setShowWhatsAppModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">WhatsApp Number</label>
                            <input type="text" className="form-control" placeholder="+91 9876543210" value={tempNumber} onChange={(e) => setTempNumber(e.target.value)} />
                            <small className="text-muted">Include country code</small>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Message</label>
                            <textarea className="form-control" rows="4" placeholder="Enter message..." value={tempMessage} onChange={(e) => setTempMessage(e.target.value)}></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowWhatsAppModal(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveWhatsAppSettings}>Save Settings</button>
                        <button type="button" className="btn btn-success" onClick={handleSendWhatsApp} disabled={!tempNumber || !tempMessage}>
                            <FaWhatsapp className="me-2" /> Open WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WhatsAppModal
