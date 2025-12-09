'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch } from 'react-icons/fi'

const GlobalSearch = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState('all')
    const [isOpen, setIsOpen] = useState(false)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchRef = useRef(null)

    const searchTypes = [
        { value: 'all', label: 'All', path: '' },
        { value: 'teachers', label: 'Teachers', path: '/teachers' },
        { value: 'students', label: 'Students', path: '/students' },
        { value: 'exams', label: 'Exams', path: '/exam' },
        { value: 'subjects', label: 'Subjects', path: '/subjects' },
        { value: 'categories', label: 'Categories', path: '/categories' },
        { value: 'questions', label: 'Questions', path: '/question-bank' }
    ]

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside, { passive: true })
        return () => document.removeEventListener('mousedown', handleClickOutside, { passive: true })
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch()
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, searchType])

    const performSearch = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
            const data = await response.json()
            if (data.success) {
                setResults(data.results)
                setIsOpen(true)
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResultClick = (result) => {
        const typeConfig = searchTypes.find(t => t.value === result.type)
        if (typeConfig && typeConfig.path) {
            // Navigate to the page with search query
            router.push(`${typeConfig.path}?search=${encodeURIComponent(result.name || result.title)}`)
        }
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim() && results.length > 0) {
            handleResultClick(results[0])
        }
    }

    return (
        <div className="nxl-h-item d-none d-sm-flex" ref={searchRef}>
            <div className="full-screen-sw full-screen-toggle" style={{ width: '500px' }}>
                <form onSubmit={handleSearch} className="d-flex align-items-center gap-2">
                    <div className="dropdown" style={{ width: '160px' }}>
                        <select 
                            className="form-select form-select-sm"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            style={{ fontSize: '12px' }}
                        >
                            {searchTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="position-relative flex-grow-1">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
                        />
                        <FiSearch 
                            className="position-absolute" 
                            style={{ 
                                right: '10px', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#6c757d'
                            }} 
                        />
                        
                        {/* Search Results Dropdown */}
                        {isOpen && searchQuery.length >= 2 && (
                            <div 
                                className="position-absolute bg-white border rounded shadow-lg mt-1 w-100" 
                                style={{ 
                                    zIndex: 1050, 
                                    maxHeight: '400px', 
                                    overflowY: 'auto' 
                                }}
                            >
                                {loading ? (
                                    <div className="p-3 text-center">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="p-3 text-center text-muted">
                                        No results found
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {results.map((result, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                                                onClick={() => handleResultClick(result)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="avatar-text avatar-sm bg-soft-primary text-primary">
                                                    {result.type === 'teachers' && 'T'}
                                                    {result.type === 'students' && 'S'}
                                                    {result.type === 'exams' && 'E'}
                                                    {result.type === 'subjects' && 'SB'}
                                                    {result.type === 'categories' && 'C'}
                                                    {result.type === 'questions' && 'Q'}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold">{result.name || result.title}</div>
                                                    <div className="fs-11 text-muted">
                                                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                                                        {result.email && ` • ${result.email}`}
                                                        {result.description && ` • ${result.description.substring(0, 50)}...`}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GlobalSearch
