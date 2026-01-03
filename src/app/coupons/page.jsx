'use client';
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiRefreshCw, FiTag } from 'react-icons/fi';
import Swal from 'sweetalert2';
import CouponModal from '@/components/coupons/CouponModal';
import DuplicateLayout from '../duplicateLayout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/coupons?format=admin');
            const data = await response.json();

            if (data.success) {
                setCoupons(data.data);
            } else {
                Swal.fire('Error', 'Failed to fetch coupons', 'error');
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
            Swal.fire('Error', 'Failed to fetch coupons', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Coupon?',
            text: 'This action cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/coupons/${id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Deleted!', 'Coupon has been deleted', 'success');
                    fetchCoupons();
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting coupon:', error);
                Swal.fire('Error', 'Failed to delete coupon', 'error');
            }
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: `Coupon code "${code}" copied to clipboard`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const getStatusBadge = (coupon) => {
        const now = new Date();
        const start = new Date(coupon.startDate);
        const end = new Date(coupon.endDate);

        if (!coupon.isActive) {
            return <span className="badge bg-secondary">Inactive</span>;
        }
        if (now < start) {
            return <span className="badge bg-warning">Scheduled</span>;
        }
        if (now > end) {
            return <span className="badge bg-danger">Expired</span>;
        }
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return <span className="badge bg-danger">Limit Reached</span>;
        }
        return <span className="badge bg-success">Active</span>;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <ProtectedRoute>
            <DuplicateLayout>
                <div className="main-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="page-header">
                                    <div className="page-header-left d-flex align-items-center">
                                        <div className="page-header-title">
                                            <h5 className="m-b-10">Coupon Management</h5>
                                        </div>
                                        <ul className="breadcrumb">
                                            <li className="breadcrumb-item"><a href="/">Home</a></li>
                                            <li className="breadcrumb-item">Coupons</li>
                                        </ul>
                                    </div>
                                    <div className="page-header-right ms-auto">
                                        <div className="page-header-right-items">
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-icon btn-light-brand"
                                                    onClick={fetchCoupons}
                                                    disabled={loading}
                                                >
                                                    <FiRefreshCw className={loading ? 'spin' : ''} />
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        setEditingCoupon(null);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <FiPlus className="me-2" />
                                                    Create Coupon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="card stretch stretch-full">
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Code</th>
                                                        <th>Discount</th>
                                                        <th>Type</th>
                                                        <th>Validity</th>
                                                        <th>Usage</th>
                                                        <th>Status</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan="7" className="text-center py-5">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : coupons.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="7" className="text-center py-5">
                                                                <FiTag size={48} className="text-muted mb-3" />
                                                                <p className="text-muted">No coupons found</p>
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => {
                                                                        setEditingCoupon(null);
                                                                        setShowModal(true);
                                                                    }}
                                                                >
                                                                    <FiPlus className="me-2" />
                                                                    Create First Coupon
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        coupons.map((coupon) => (
                                                            <tr key={coupon._id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <code className="fs-6 fw-bold">{coupon.code}</code>
                                                                        <button
                                                                            className="btn btn-sm btn-icon btn-light"
                                                                            onClick={() => handleCopyCode(coupon.code)}
                                                                            title="Copy code"
                                                                        >
                                                                            <FiCopy size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-semibold">
                                                                        {coupon.discountType === 'percentage'
                                                                            ? `${coupon.discountValue}%`
                                                                            : `₹${coupon.discountValue}`
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {coupon.applicationType === 'all' && (
                                                                        <span className="badge bg-primary">All Courses</span>
                                                                    )}
                                                                    {coupon.applicationType === 'specific' && (
                                                                        <span className="badge bg-info">
                                                                            {coupon.courses?.length || 0} Course(s)
                                                                        </span>
                                                                    )}
                                                                    {coupon.applicationType === 'category' && (
                                                                        <span className="badge bg-warning">
                                                                            {coupon.categories?.length || 0} Category(ies)
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className="text-muted">
                                                                        {coupon.currentUses}
                                                                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                                                                    </span>
                                                                </td>
                                                                <td>{getStatusBadge(coupon)}</td>
                                                                <td>
                                                                    <div className="d-flex gap-2 justify-content-end">
                                                                        <button
                                                                            className="btn btn-sm btn-icon btn-light"
                                                                            onClick={() => {
                                                                                setEditingCoupon(coupon);
                                                                                setShowModal(true);
                                                                            }}
                                                                            title="Edit"
                                                                        >
                                                                            <FiEdit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-icon btn-light-danger"
                                                                            onClick={() => handleDelete(coupon._id)}
                                                                            title="Delete"
                                                                        >
                                                                            <FiTrash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showModal && (
                            <CouponModal
                                show={showModal}
                                onHide={() => {
                                    setShowModal(false);
                                    setEditingCoupon(null);
                                }}
                                coupon={editingCoupon}
                                onSuccess={() => {
                                    setShowModal(false);
                                    setEditingCoupon(null);
                                    fetchCoupons();
                                }}
                            />
                        )}
                    </div>
                </div>
            </DuplicateLayout>
        </ProtectedRoute>
    );
}
