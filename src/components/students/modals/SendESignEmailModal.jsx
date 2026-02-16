import React, { useState } from 'react';
import { FiMail, FiSend, FiX, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SendESignEmailModal = ({ isOpen, onClose, studentEmail, studentId, studentName }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setSubject(`${studentName || 'Student'} - Signed E-Sign Document`);
            setMessage(`Dear ${studentName || 'Student'},\n\nYour E-Sign document has been successfully processed. Please find the attached official PDF for your records.\n\nThank you,\nMD Consultancy`);
            setIsSuccess(false);
        }
    }, [isOpen, studentName]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!subject || !message) {
            toast.error('Subject and Message are required');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/admin/esign/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: studentId,
                    toEmail: studentEmail,
                    subject,
                    message
                })
            });

            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
                toast.success('Email sent successfully');
            } else {
                toast.error(data.message || 'Failed to send email');
            }
        } catch (err) {
            toast.error('Error connecting to server');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                            <FiMail className="text-primary" /> Send E-Sign PDF via Email
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={sending}></button>
                    </div>
                    <div className="modal-body py-4">
                        {isSuccess ? (
                            <div className="text-center py-4">
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle" style={{ width: '80px', height: '80px' }}>
                                        <FiCheckCircle size={40} className="text-success" />
                                    </div>
                                </div>
                                <h4 className="fw-bold text-success mb-2">Email Sent!</h4>
                                <p className="text-muted mb-0">
                                    The E-Sign PDF has been successfully sent to<br />
                                    <strong className="text-dark">{studentEmail}</strong>
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">To</label>
                                    <input
                                        type="email"
                                        className="form-control bg-light"
                                        value={studentEmail || ''}
                                        readOnly
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Subject</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={subject || ''}
                                        onChange={(e) => setSubject(e.target.value)}
                                        disabled={sending}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Message</label>
                                    <textarea
                                        className="form-control"
                                        rows="5"
                                        value={message || ''}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={sending}
                                    ></textarea>
                                    <div className="form-text small">
                                        <FiAlertCircle className="me-1" /> The E-Sign PDF will be automatically attached.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer border-0 pt-0">
                        {isSuccess ? (
                            <button
                                type="button"
                                className="btn btn-success w-100 py-2 fw-bold"
                                onClick={onClose}
                            >
                                Done
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-light px-4"
                                    onClick={onClose}
                                    disabled={sending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary px-4 d-flex align-items-center gap-2"
                                    onClick={handleSend}
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <><FiLoader className="spinner-border spinner-border-sm" /> Sending...</>
                                    ) : (
                                        <><FiSend /> Send Email</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Premium Loader Overlay for "Sending" */}
            {sending && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    zIndex: 1060,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h6 className="mt-3 fw-bold text-primary animate-pulse">Generating PDF & Sending Mail...</h6>
                    <p className="text-muted small">This may take a few seconds.</p>
                </div>
            )}
        </div>
    );
};

export default SendESignEmailModal;
