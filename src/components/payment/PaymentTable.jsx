'use client'
import React, { useEffect, useState } from 'react'
import Table from '@/components/shared/table/Table'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { FiEye } from 'react-icons/fi'

const PaymentTable = () => {
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/admin/payments')
            const data = await res.json()
            if (data.success) {
                setPayments(data.data)
            }
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setLoading(false)
        }
    }

    const columnHelper = createColumnHelper()

    const columns = [
        columnHelper.accessor('createdAt', {
            header: () => 'Date',
            cell: info => {
                try {
                    return format(new Date(info.getValue()), 'dd MMM yyyy, hh:mm a')
                } catch (e) {
                    return 'Invalid Date'
                }
            }
        }),
        columnHelper.accessor('user.name', {
            header: () => 'Student',
            cell: info => info.getValue() || <span className="text-muted">Deleted User</span>
        }),
        columnHelper.accessor('course.title', {
            header: () => 'Course',
            cell: info => info.getValue() || <span className="text-muted">Deleted Course</span>
        }),
        columnHelper.accessor('amount', {
            header: () => 'Paid Amount',
            cell: info => <span className="fw-bold">₹{info.getValue()}</span>
        }),
        columnHelper.accessor('status', {
            header: () => 'Status',
            cell: info => (
                <span className={`badge bg-soft-${info.getValue() === 'success' ? 'success' : 'danger'} text-${info.getValue() === 'success' ? 'success' : 'danger'}`}>
                    {info.getValue()?.toUpperCase()}
                </span>
            )
        }),
        columnHelper.accessor('action', {
            header: () => 'Action',
            cell: info => (
                <div
                    onClick={() => {
                        setSelectedPayment(info.row.original)
                        setShowModal(true)
                    }}
                    className="avatar-text avatar-md cursor-pointer hover-bg-light"
                    title="View Details"
                >
                    <FiEye size={18} />
                </div>
            )
        })
    ]

    if (loading) return <div className="p-4 text-center">Loading payments...</div>

    return (
        <>
            <Table data={payments} columns={columns} />

            {showModal && selectedPayment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Payment Details</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="card-body">
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <h6 className="text-muted mb-2">Student Information</h6>
                                            <p className="mb-1"><strong>Name:</strong> {selectedPayment.user?.name || 'N/A'}</p>
                                            <p className="mb-1"><strong>Email:</strong> {selectedPayment.user?.email || 'N/A'}</p>
                                            <p className="mb-0"><strong>Phone:</strong> {selectedPayment.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div className="col-md-6 text-md-end">
                                            <h6 className="text-muted mb-2">Payment Status</h6>
                                            <span className={`badge bg-soft-${selectedPayment.status === 'success' ? 'success' : 'danger'} text-${selectedPayment.status === 'success' ? 'success' : 'danger'} fs-6`}>
                                                {selectedPayment.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <h6 className="text-muted mb-3">Transaction Details</h6>
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr>
                                                    <th width="30%" className="bg-light">Razorpay Payment ID</th>
                                                    <td>{selectedPayment.razorpayPaymentId}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-light">Razorpay Order ID</th>
                                                    <td>{selectedPayment.razorpayOrderId}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-light">Course Purchased</th>
                                                    <td><strong className="text-primary">{selectedPayment.course?.title || 'Unknown Course'}</strong></td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-light">Date & Time</th>
                                                    <td>{format(new Date(selectedPayment.createdAt), 'PPpp')}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-light">Amount Paid</th>
                                                    <td className="fs-5 fw-bold text-success">₹{selectedPayment.amount}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-light">Original Price</th>
                                                    <td>₹{selectedPayment.originalPrice || 'N/A'}</td>
                                                </tr>
                                                {selectedPayment.discountAmount > 0 && (
                                                    <tr>
                                                        <th className="bg-light">Discount Applied</th>
                                                        <td className="text-danger">-₹{selectedPayment.discountAmount}</td>
                                                    </tr>
                                                )}
                                                {selectedPayment.couponCode && (
                                                    <tr>
                                                        <th className="bg-light">Coupon Code</th>
                                                        <td><span className="badge bg-info">{selectedPayment.couponCode}</span></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <small className="text-muted">Transaction recorded in database.</small>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default PaymentTable
