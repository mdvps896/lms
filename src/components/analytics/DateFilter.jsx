
import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';

const DateFilter = ({ startDate, endDate, onChange }) => {
    return (
        <div className="d-flex align-items-center bg-white p-2 border rounded-3 shadow-sm">
            <FaCalendarAlt className="text-muted ms-2 me-2" />
            <div className="d-flex align-items-center">
                <DatePicker
                    selected={startDate}
                    onChange={(date) => onChange(date, endDate)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="form-control form-control-sm border-0 fw-semibold text-dark shadow-none"
                    dateFormat="MMM d, yyyy"
                    placeholderText="Start Date"
                />
                <span className="text-muted mx-1">-</span>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => onChange(startDate, date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="form-control form-control-sm border-0 fw-semibold text-dark shadow-none"
                    dateFormat="MMM d, yyyy"
                    placeholderText="End Date"
                />
            </div>
        </div>
    );
};

export default DateFilter;
