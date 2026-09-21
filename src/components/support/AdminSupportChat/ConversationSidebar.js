'use client'

import React from 'react'
import { format } from 'date-fns'
import { FiSearch, FiPlus, FiUsers } from 'react-icons/fi'
import UserAvatar from './UserAvatar'

const ConversationSidebar = ({
    filteredConversations,
    loadingConversations,
    selectedUser,
    setSelectedUser,
    chatSearchQuery,
    setChatSearchQuery,
    primaryMethod,
    handleOpenWhatsApp,
    handleSaveSettings,
    setShowNewChatModal,
    setShowBulkModal
}) => {
    return (
        <div className="col-md-3 border-end h-100 overflow-auto">
            <div className="p-3 border-bottom sticky-top bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Support Chat</h6>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setShowNewChatModal(true)} title="New Chat">
                            <FiPlus />
                        </button>
                        <button className="btn btn-sm btn-outline-success" onClick={() => setShowBulkModal(true)} title="Bulk Message">
                            <FiUsers />
                        </button>
                    </div>
                </div>

                {/* Search Bar for Chats */}
                <div className="input-group input-group-sm mb-3">
                    <span className="input-group-text bg-white border-end-0"><FiSearch className="text-muted" /></span>
                    <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search conversations..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                    />
                </div>

                <div className="mb-2">
                    <select
                        className="form-select form-select-sm"
                        value={primaryMethod}
                        onChange={(e) => {
                            if (e.target.value === 'whatsapp') handleOpenWhatsApp()
                            else handleSaveSettings({ primaryMethod: 'chat' })
                        }}
                    >
                        <option value="chat">💬 Default Chat</option>
                        <option value="whatsapp">📱 WhatsApp Support</option>
                    </select>
                </div>
            </div>

            <div className="list-group list-group-flush">
                {filteredConversations.map((conv) => {
                    const user = conv.userDetails || { _id: conv._id, name: 'Unknown User', email: 'N/A' };
                    return (
                        <button
                            key={conv._id}
                            onClick={() => setSelectedUser(user)}
                            className={`list-group-item list-group-item-action p-3 ${selectedUser?._id === user._id ? 'active' : ''}`}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <UserAvatar user={user} />
                                    <div>
                                        <h6 className="mb-0">{user.name} {user.isSupportBlocked && <span className="badge bg-danger ms-1" style={{ fontSize: '9px' }}>BLOCKED</span>}</h6>
                                        <small className="text-truncate d-block" style={{ maxWidth: '150px' }}>
                                            {conv.latestMessage.text || 'Image attached'}
                                        </small>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <small className="d-block mb-1">
                                        {format(new Date(conv.latestMessage.createdAt), 'HH:mm')}
                                    </small>
                                    {conv.unreadCount > 0 && (
                                        <span className="badge bg-danger rounded-pill">{conv.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {filteredConversations.length === 0 && !loadingConversations && (
                    <div className="p-4 text-center text-muted">No conversations found</div>
                )}
            </div>
        </div>
    )
}

export default ConversationSidebar
