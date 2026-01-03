import React from 'react'
import { FiDollarSign } from 'react-icons/fi'

const PaymentHeader = () => {
    return (
        <div className="d-flex align-items-center justify-content-between">
            <div className="page-header-left d-flex align-items-center">
                <div className="page-header-title d-flex align-items-center">
                    <div className="page-header-icon">
                        <FiDollarSign className="text-primary" />
                    </div>
                    <h5 className="m-b-10">Payments</h5>
                </div>
                <ul className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/">Dashboard</a></li>
                    <li className="breadcrumb-item">Payments</li>
                </ul>
            </div>
        </div>
    )
}

export default PaymentHeader
