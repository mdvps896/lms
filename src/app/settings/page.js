'use client';
import React, { useState, useEffect } from 'react';
import { FiSettings, FiUser, FiMonitor, FiEdit, FiShield, FiMail, FiLogIn, FiLink, FiBell, FiAward, FiHash, FiCreditCard, FiCamera } from 'react-icons/fi';
import GeneralSettings from '../../components/settings/GeneralSettings';
import AuthPagesSettings from '../../components/settings/AuthPagesSettings';
import ResultDisplaySettings from '../../components/settings/ResultDisplaySettings';
import ThemeDesignSettings from '../../components/settings/ThemeDesignSettings';
import SecuritySMTPSettings from '../../components/settings/SecuritySMTPSettings';
import IntegrationsSettings from '../../components/settings/IntegrationsSettings';
import PaymentSettings from '../../components/settings/PaymentSettings';
import NotificationSoundsTab from '../../components/settings/NotificationSoundsTab';
import CertificateSettings from '../../components/settings/CertificateSettings';
import RollNumberSettings from '../../components/settings/RollNumberSettings';
import PdfSelfieSettings from '../../components/settings/PdfSelfieSettings';
import SettingsSkeleton from '../../components/settings/SettingsSkeleton';
import { toast } from 'react-toastify';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const tabs = [
        {
            id: 'general',
            label: 'General',
            icon: <FiSettings className="me-2" />,
            component: GeneralSettings
        },
        {
            id: 'auth-pages',
            label: 'Login & Register',
            icon: <FiLogIn className="me-2" />,
            component: AuthPagesSettings
        },
        {
            id: 'result-display',
            label: 'Result Display',
            icon: <FiMonitor className="me-2" />,
            component: ResultDisplaySettings
        },
        {
            id: 'certificate',
            label: 'Certificate',
            icon: <FiAward className="me-2" />,
            component: CertificateSettings
        },
        {
            id: 'theme-design',
            label: 'Theme & Design',
            icon: <FiEdit className="me-2" />,
            component: ThemeDesignSettings
        },
        {
            id: 'security-smtp',
            label: 'Security & SMTP',
            icon: <FiShield className="me-2" />,
            component: SecuritySMTPSettings
        },
        {
            id: 'integrations',
            label: 'Integrations',
            icon: <FiLink className="me-2" />,
            component: IntegrationsSettings
        },
        {
            id: 'payment',
            label: 'Payment',
            icon: <FiCreditCard className="me-2" />,
            component: PaymentSettings
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <FiBell className="me-2" />,
            component: NotificationSoundsTab
        },
        {
            id: 'roll-number',
            label: 'Roll Number',
            icon: <FiHash className="me-2" />,
            component: RollNumberSettings
        },
        {
            id: 'pdf-selfie',
            label: 'PDF Selfie',
            icon: <FiCamera className="me-2" />,
            component: PdfSelfieSettings
        }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (tabSettings) => {
        setSaving(true);
        try {
            console.log('Sending settings update for tab:', activeTab, 'with data:', tabSettings);

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tab: activeTab,
                    settings: tabSettings
                }),
            });
            const data = await res.json();

            console.log('Settings update response:', data);

            if (data.success) {
                setSettings(data.data);
                toast.success(data.message || 'Settings updated successfully');
                return true;
            } else {
                console.error('Settings update failed:', data.error);
                toast.error(data.error || 'Failed to update settings');
                return false;
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings: ' + error.message);
            return false;
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Settings</h2>
                <div className="d-flex align-items-center gap-2">
                    <FiSettings className="text-primary" size={24} />
                    <span className="text-muted">System Configuration</span>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-3 mb-4">
                    <div className="position-sticky" style={{ top: '80px', zIndex: 10 }}>
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white py-3">
                                <h6 className="mb-0 fw-bold">Settings Menu</h6>
                            </div>
                            <div className="list-group list-group-flush">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${activeTab === tab.id ? 'active' : ''
                                            }`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-9">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h6 className="mb-0 fw-bold d-flex align-items-center">
                                {tabs.find(tab => tab.id === activeTab)?.icon}
                                {tabs.find(tab => tab.id === activeTab)?.label} Settings
                            </h6>
                        </div>
                        <div className="card-body">
                            {ActiveComponent ? (
                                <ActiveComponent
                                    settings={settings}
                                    onUpdate={updateSettings}
                                    saving={saving}
                                />
                            ) : (
                                <div className="text-center py-5">
                                    <h5>Settings Component Loading...</h5>
                                    <p className="text-muted">Please select a settings tab</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;