'use client'

import React from 'react'
import { FiSearch } from 'react-icons/fi'
import UserAvatar from './UserAvatar'

const NewChatModal = ({
    showNewChatModal,
    setShowNewChatModal,
    searchQuery,
    setSearchQuery,
    searchResults,
    handleStartNewChat
}) => {
    if (!showNewChatModal) return null

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Start New Chat</h5>
                        <button type="button" className="btn-close" onClick={() => setShowNewChatModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div className="input-group mb-3">
                            <span className="input-group-text"><FiSearch /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search student by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="list-group">
                            {searchResults.map(user => (
                                <button key={user._id} className="list-group-item list-group-item-action" onClick={() => handleStartNewChat(user)}>
                                    <div className="d-flex align-items-center">
                                        <UserAvatar user={user} />
                                        <div>
                                            <h6 className="mb-0">{user.name}</h6>
                                            <small className="text-muted">{user.email}</small>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {searchResults.length === 0 && searchQuery.length >= 2 && (
                                <div className="text-center text-muted py-3">No students found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewChatModal
