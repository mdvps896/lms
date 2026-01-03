
'use client'

import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import Select from 'react-select'

const MeetingFilter = ({ filters, setFilters }) => {
    const [categories, setCategories] = useState([])

    useEffect(() => {
        // Fetch categories for filter dropdown
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories')
                const data = await response.json()
                if (data.success) {
                    setCategories(data.data.map(cat => ({ value: cat._id, label: cat.name })))
                }
            } catch (error) {
                console.error("Failed to load categories", error)
            }
        }
        fetchCategories()
    }, [])

    return (
        <div className="p-4 border-bottom bg-light">
            <div className="row g-3">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search meetings..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <div className="col-md-3">
                    <Select
                        placeholder="Filter by Category"
                        options={categories}
                        value={filters.category}
                        onChange={(val) => setFilters({ ...filters, category: val })}
                        isClearable
                        classNamePrefix="select"
                    />
                </div>
                <div className="col-md-5">
                    <div className="input-group">
                        <DatePicker
                            selected={filters.startDate}
                            onChange={(date) => setFilters({ ...filters, startDate: date })}
                            selectsStart
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            placeholderText="Start Date"
                            className="form-control"
                        />
                        <span className="input-group-text">to</span>
                        <DatePicker
                            selected={filters.endDate}
                            onChange={(date) => setFilters({ ...filters, endDate: date })}
                            selectsEnd
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            minDate={filters.startDate}
                            placeholderText="End Date"
                            className="form-control"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MeetingFilter
