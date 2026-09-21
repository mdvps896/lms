'use client'

import React from 'react'
import { format } from 'date-fns'
import { FiImage, FiSend, FiMessageSquare, FiMoreVertical, FiTrash2, FiSlash } from 'react-icons/fi'
import UserAvatar from './UserAvatar'

const ChatWindow = ({
    selectedUser,
    groupedMessages,
    chatEndRef,
    showOptionsDropdown,
    setShowOptionsDropdown,
    handleBlockUser,
    handleDeleteConversation,
    uploading,
    handleImageUpload,
    inputText,
    setInputText,
    handleSendMessage
}) => {
    return (
        <div className="col-md-9 h-100 d-flex flex-column">
            {selectedUser ? (
                <>
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                        <div className="d-flex align-items-center">
                            <UserAvatar user={selectedUser} />
                            <div>
                                <h6 className="mb-0">{selectedUser.name} {selectedUser.isSupportBlocked && <span className="text-danger small">(Blocked)</span>}</h6>
                                <small className="text-muted">{selectedUser.email}</small>
                            </div>
                        </div>
                        <div className="dropdown">
                            <button className="btn btn-light btn-sm rounded-circle" type="button" onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}>
                                <FiMoreVertical />
                            </button>
                            {showOptionsDropdown && (
                                <div className="dropdown-menu show" style={{ position: 'absolute', right: 0, top: '100%' }}>
                                    <button className="dropdown-item text-danger" onClick={() => { handleBlockUser(); setShowOptionsDropdown(false); }}>
                                        <FiSlash className="me-2" /> {selectedUser.isSupportBlocked ? 'Unblock User' : 'Block User'}
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item text-danger" onClick={() => { handleDeleteConversation(); setShowOptionsDropdown(false); }}>
                                        <FiTrash2 className="me-2" /> Delete Chat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-grow-1 overflow-auto p-4 bg-light" onClick={() => setShowOptionsDropdown(false)}>
                        {Object.keys(groupedMessages).map(date => (
                            <div key={date}>
                                <div className="text-center my-4">
                                    <span className="badge bg-white text-dark shadow-sm px-3 py-2">
                                        {format(new Date(date), 'MMMM dd, yyyy')}
                                    </span>
                                </div>
                                {groupedMessages[date].map((msg, idx) => (
                                    <div key={idx} className={`d-flex mb-4 ${msg.isAdmin ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div className={`p-3 rounded-3 shadow-sm ${msg.isAdmin ? 'bg-primary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '75%' }}>
                                            {msg.images?.map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img.startsWith('http') ? img : window.location.origin + img}
                                                    alt="attachment"
                                                    className="img-fluid rounded mb-2 d-block cursor-pointer"
                                                    onClick={() => window.open(img.startsWith('http') ? img : window.location.origin + img, '_blank')}
                                                />
                                            ))}
                                            <p className="mb-1">{msg.text}</p>
                                            <small className={msg.isAdmin ? 'text-white-50' : 'text-muted'}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {!selectedUser.isSupportBlocked ? (
                        <div className="p-3 border-top bg-white">
                            <form onSubmit={handleSendMessage} className="input-group">
                                <input
                                    type="file"
                                    id="chat-upload"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <label htmlFor="chat-upload" className="btn btn-outline-secondary mb-0 d-flex align-items-center">
                                    {uploading ? <span className="spinner-border spinner-border-sm" /> : <FiImage size={18} />}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Type your message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button className="btn btn-primary px-4 d-flex align-items-center" type="submit">
                                    <FiSend className="me-2" /> Send
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-3 border-top bg-light text-center text-danger">
                            <FiSlash className="me-2" /> You cannot message this user because they are blocked.
                        </div>
                    )}
                </>
            ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted flex-column">
                    <FiMessageSquare size={60} className="mb-3 opacity-25" />
                    <p className="fw-medium">Select a user or start a new chat</p>
                </div>
            )}
        </div>
    )
}

export default ChatWindow
