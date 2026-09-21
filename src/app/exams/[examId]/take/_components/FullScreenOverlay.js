'use client';
// Full-screen dark overlay with a spinner, title and message.
// Used for both the "Submitting Exam..." and "Saving Recordings..." states,
// extracted verbatim (same markup/styles) from page.js.
export default function FullScreenOverlay({ title, message }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <h3 className="text-white mt-4">{title}</h3>
            <p className="text-white-50 mt-2">{message}</p>
        </div>
    );
}
