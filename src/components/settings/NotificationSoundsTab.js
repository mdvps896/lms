'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function NotificationSoundsTab() {
    const [settings, setSettings] = useState({
        chatNotificationSound: {
            enabled: true,
            soundFile: '/sounds/notification.mp3',
            volume: 0.7
        },
        examNotificationSound: {
            enabled: true,
            soundFile: '/sounds/exam-alert.mp3',
            volume: 0.8
        },
        warningSound: {
            enabled: true,
            soundFile: '/sounds/warning.mp3',
            volume: 0.9
        }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success && data.data?.notifications) {
                setSettings(data.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tab: 'notifications',
                    settings: settings
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Notification settings saved successfully!');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (type, event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            toast.error('Please upload an audio file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const response = await fetch('/api/upload-sound', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    [type]: {
                        ...prev[type],
                        soundFile: data.filePath
                    }
                }));
                toast.success('Sound file uploaded successfully!');
            } else {
                toast.error('Failed to upload sound file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload sound file');
        }
    };

    const playTestSound = (soundFile) => {
        try {
            const audio = new Audio(soundFile);
            audio.volume = 0.7;
            audio.play().catch(e => {
                toast.error('Failed to play sound. Please check the file.');
            });
        } catch (error) {
            toast.error('Failed to play sound');
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">
                    <i className="bi bi-bell me-2"></i>
                    Notification Sounds Settings
                </h5>
            </div>
            <div className="card-body">
                <p className="text-muted mb-4">
                    Configure notification sounds for different events. Upload custom audio files or use default sounds.
                </p>

                {/* Chat Notification Sound */}
                <div className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                            <i className="bi bi-chat-dots me-2"></i>
                            Chat Notification Sound
                        </h6>
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={settings.chatNotificationSound.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    chatNotificationSound: {
                                        ...settings.chatNotificationSound,
                                        enabled: e.target.checked
                                    }
                                })}
                            />
                            <label className="form-check-label">Enabled</label>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Sound File</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settings.chatNotificationSound.soundFile}
                                    readOnly
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => playTestSound(settings.chatNotificationSound.soundFile)}
                                >
                                    <i className="bi bi-play-fill"></i> Test
                                </button>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Volume</label>
                            <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.chatNotificationSound.volume}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    chatNotificationSound: {
                                        ...settings.chatNotificationSound,
                                        volume: parseFloat(e.target.value)
                                    }
                                })}
                            />
                            <small className="text-muted">{Math.round(settings.chatNotificationSound.volume * 100)}%</small>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Upload Custom</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload('chatNotificationSound', e)}
                            />
                        </div>
                    </div>
                </div>

                {/* Exam Alert Sound */}
                <div className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                            <i className="bi bi-alarm me-2"></i>
                            Exam Alert Sound
                        </h6>
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={settings.examNotificationSound.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    examNotificationSound: {
                                        ...settings.examNotificationSound,
                                        enabled: e.target.checked
                                    }
                                })}
                            />
                            <label className="form-check-label">Enabled</label>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Sound File</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settings.examNotificationSound.soundFile}
                                    readOnly
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => playTestSound(settings.examNotificationSound.soundFile)}
                                >
                                    <i className="bi bi-play-fill"></i> Test
                                </button>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Volume</label>
                            <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.examNotificationSound.volume}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    examNotificationSound: {
                                        ...settings.examNotificationSound,
                                        volume: parseFloat(e.target.value)
                                    }
                                })}
                            />
                            <small className="text-muted">{Math.round(settings.examNotificationSound.volume * 100)}%</small>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Upload Custom</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload('examNotificationSound', e)}
                            />
                        </div>
                    </div>
                </div>

                {/* Warning Sound */}
                <div className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Warning Sound
                        </h6>
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={settings.warningSound.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    warningSound: {
                                        ...settings.warningSound,
                                        enabled: e.target.checked
                                    }
                                })}
                            />
                            <label className="form-check-label">Enabled</label>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Sound File</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settings.warningSound.soundFile}
                                    readOnly
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => playTestSound(settings.warningSound.soundFile)}
                                >
                                    <i className="bi bi-play-fill"></i> Test
                                </button>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Volume</label>
                            <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.warningSound.volume}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    warningSound: {
                                        ...settings.warningSound,
                                        volume: parseFloat(e.target.value)
                                    }
                                })}
                            />
                            <small className="text-muted">{Math.round(settings.warningSound.volume * 100)}%</small>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Upload Custom</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload('warningSound', e)}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="d-flex justify-content-end">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-save me-2"></i>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
