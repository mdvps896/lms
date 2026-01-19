'use client'
import React, { useState, useEffect } from 'react'
import { FiCheck, FiX, FiCreditCard, FiKey, FiGlobe, FiDollarSign } from 'react-icons/fi'
import Swal from 'sweetalert2'

// SVG Icons
const RazorpayIcon = () => (
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhI5ggwVY7mlYgj0sDP6ZoFBkfWN-2LS-tWw&s" alt="Razorpay" width="24" height="24" />
);

// Helper to load script
const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

const PaymentSettings = ({ settings, onUpdate, saving }) => {
    const [formData, setFormData] = useState({
        razorpay: {
            enabled: false,
            keyId: '',
            keySecret: '',
            webhookSecret: '',
            webhookUrl: '',
            currency: 'INR'
        },
        offlinePayments: {
            enabled: false,
            message: 'Please pay offline'
        }
    })

    const [showSecrets, setShowSecrets] = useState({
        razorpayKeySecret: false,
        razorpayWebhookSecret: false
    })

    const [testAmount, setTestAmount] = useState(10);
    const [loadingTest, setLoadingTest] = useState(false);

    useEffect(() => {
        if (settings && settings.integrations) {
            setFormData(prev => ({
                ...prev,
                razorpay: settings.integrations.razorpay || prev.razorpay,
                offlinePayments: settings.integrations.offlinePayments || prev.offlinePayments
            }))
        }
    }, [settings])

    const handleInputChange = (provider, field, value) => {
        setFormData(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value
            }
        }))
    }

    const handleToggle = (provider) => {
        setFormData(prev => {
            const newState = {
                ...prev,
                [provider]: {
                    ...prev[provider],
                    enabled: !prev[provider].enabled
                }
            };

            // If we're enabling offline payments, disable razorpay
            if (provider === 'offlinePayments' && newState.offlinePayments.enabled) {
                newState.razorpay.enabled = false;
            }
            // If we're enabling razorpay, disable offline payments
            else if (provider === 'razorpay' && newState.razorpay.enabled) {
                newState.offlinePayments.enabled = false;
            }

            return newState;
        })
    }

    const toggleSecretVisibility = (field) => {
        setShowSecrets(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    const handleSubmit = async () => {
        // Validate Razorpay if enabled
        if (formData.razorpay.enabled && (!formData.razorpay.keyId || !formData.razorpay.keySecret)) {
            Swal.fire({
                icon: 'error',
                title: 'Razorpay Credentials Missing',
                text: 'Key ID and Key Secret are required when Razorpay is enabled',
                timer: 3000
            })
            return;
        }

        await onUpdate(formData); // This sends { razorpay: {...} }
    }

    const handleTestPayment = async () => {
        const activeGateway = formData.razorpay.enabled ? 'razorpay' : null;

        if (!activeGateway) {
            Swal.fire('Error', 'Please enable Razorpay first and Save settings.', 'error');
            return;
        }

        if (testAmount < 1) {
            Swal.fire('Error', 'Please enter a valid amount (minimum 1)', 'error');
            return;
        }

        setLoadingTest(true);
        try {
            const res = await fetch('/api/settings/test-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gateway: activeGateway, amount: testAmount })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Test payment initialization failed');
            }

            if (activeGateway === 'razorpay') {
                const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                if (!res) {
                    throw new Error('Razorpay SDK failed to load');
                    return;
                }

                const options = {
                    key: data.data.key_id,
                    amount: data.data.amount,
                    currency: data.data.currency,
                    name: "Test Payment",
                    description: "Test Transaction",
                    order_id: data.data.id,
                    handler: function (response) {
                        Swal.fire('Success', 'Payment Successful! Payment ID: ' + response.razorpay_payment_id, 'success');
                    },
                    prefill: {
                        name: "Test User",
                        email: "test@example.com",
                        contact: "9999999999"
                    },
                    theme: { color: "#3399cc" }
                };
                const rzp1 = new window.Razorpay(options);
                rzp1.open();
            }

        } catch (error) {
            console.error(error);
            Swal.fire('Test Failed', error.message, 'error');
        } finally {
            setLoadingTest(false);
        }
    }

    const isAnyGatewayEnabled = formData.razorpay.enabled;

    return (
        <div className="row">
            {/* Test Payment Section */}
            {isAnyGatewayEnabled && (
                <div className="col-12 mb-4">
                    <div className="card border-success border-2 shadow-sm bg-success bg-opacity-10">
                        <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center">
                                <div className="p-3 bg-white rounded-circle shadow-sm me-3 text-success">
                                    <FiDollarSign size={24} />
                                </div>
                                <div>
                                    <h5 className="mb-1 text-success fw-bold">Test Live Payment</h5>
                                    <p className="mb-0 text-muted small">
                                        Test the currently enabled gateway with a real transaction.
                                    </p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-0 fw-bold">₹</span>
                                    <input
                                        type="number"
                                        className="form-control border-0"
                                        placeholder="Amount"
                                        value={testAmount}
                                        onChange={(e) => setTestAmount(Number(e.target.value))}
                                        min="1"
                                        style={{ maxWidth: '100px' }}
                                    />
                                </div>
                                <button
                                    className="btn btn-success fw-bold px-4"
                                    onClick={handleTestPayment}
                                    disabled={loadingTest}
                                >
                                    {loadingTest ? 'Starting...' : 'Pay Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Offline Payments Section */}
            <div className={`col-12 mb-4 ${!formData.offlinePayments?.enabled ? 'opacity-75' : ''}`} style={{ transition: 'all 0.3s' }}>
                <div className={`card shadow-sm border-0 ${formData.offlinePayments?.enabled ? 'border-start border-4 border-warning' : ''}`}>
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center">
                                <div className="bg-white p-3 rounded-circle shadow-sm me-3 border text-warning">
                                    <FiCreditCard size={24} />
                                </div>
                                <div>
                                    <h5 className="mb-1">Offline Payments</h5>
                                    <p className="text-muted mb-0 small">Cash, Bank Transfer, or Manual Payment</p>
                                </div>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={formData.offlinePayments?.enabled || false}
                                    onChange={() => handleToggle('offlinePayments')}
                                    style={{ width: '3em', height: '1.5em' }}
                                />
                                <label className="form-check-label ms-2 mt-1 fw-bold">
                                    {formData.offlinePayments?.enabled ? 'Active' : 'Inactive'}
                                </label>
                            </div>
                        </div>

                        {formData.offlinePayments?.enabled && (
                            <div className="alert alert-warning bg-warning bg-opacity-10 border-warning border-opacity-20">
                                <h6 className="fw-bold mb-2">Offline Payment Message</h6>
                                <p className="small mb-3 text-muted">This message will be shown to students in the mobile app when they try to purchase a course.</p>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.offlinePayments?.message || ''}
                                    onChange={(e) => handleInputChange('offlinePayments', 'message', e.target.value)}
                                    placeholder="e.g., Please contact administrator for payment"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Razorpay Section */}
            <div className={`col-12 mb-5 ${!formData.razorpay.enabled ? 'opacity-75' : ''}`} style={{ transition: 'all 0.3s' }}>
                <div className={`card shadow-sm border-0 ${formData.razorpay.enabled ? 'border-start border-4 border-primary' : ''}`}>
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center">
                                <div className="bg-white p-3 rounded-circle shadow-sm me-3 border">
                                    <RazorpayIcon />
                                </div>
                                <div>
                                    <h5 className="mb-1">Razorpay Payment Gateway</h5>
                                    <p className="text-muted mb-0 small">Credit/Debit Card, Netbanking, UPI</p>
                                </div>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={formData.razorpay?.enabled || false}
                                    onChange={() => handleToggle('razorpay')}
                                    style={{ width: '3em', height: '1.5em' }}
                                />
                                <label className="form-check-label ms-2 mt-1 fw-bold">
                                    {formData.razorpay?.enabled ? 'Active' : 'Inactive'}
                                </label>
                            </div>
                        </div>

                        {formData.razorpay?.enabled && (
                            <>
                                <div className="alert alert-light border">
                                    <h6 className="alert-heading fw-bold small text-muted text-uppercase mb-2">Configuration</h6>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Key ID</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.razorpay?.keyId || ''}
                                                onChange={(e) => handleInputChange('razorpay', 'keyId', e.target.value)}
                                                placeholder="rzp_test_..."
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Key Secret</label>
                                            <div className="input-group">
                                                <input
                                                    type={showSecrets.razorpayKeySecret ? "text" : "password"}
                                                    className="form-control"
                                                    value={formData.razorpay?.keySecret || ''}
                                                    onChange={(e) => handleInputChange('razorpay', 'keySecret', e.target.value)}
                                                    placeholder="Enter Key Secret"
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => toggleSecretVisibility('razorpayKeySecret')}
                                                >
                                                    {showSecrets.razorpayKeySecret ? <FiX /> : <FiKey />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Webhook URL</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.razorpay?.webhookUrl || ''}
                                                onChange={(e) => handleInputChange('razorpay', 'webhookUrl', e.target.value)}
                                                placeholder="https://yourdomain.com/api/webhooks/razorpay"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Webhook Secret</label>
                                            <div className="input-group">
                                                <input
                                                    type={showSecrets.razorpayWebhookSecret ? "text" : "password"}
                                                    className="form-control"
                                                    value={formData.razorpay?.webhookSecret || ''}
                                                    onChange={(e) => handleInputChange('razorpay', 'webhookSecret', e.target.value)}
                                                    placeholder="Enter Webhook Secret"
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => toggleSecretVisibility('razorpayWebhookSecret')}
                                                >
                                                    {showSecrets.razorpayWebhookSecret ? <FiX /> : <FiKey />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 text-end">
                <button
                    type="button"
                    className="btn btn-primary btn-lg px-5"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                        </>
                    ) : (
                        'Save Global Settings'
                    )}
                </button>
            </div>
        </div>
    )
}

export default PaymentSettings
