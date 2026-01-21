'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { FiImage, FiSend, FiMessageSquare, FiSearch, FiPlus, FiMoreVertical, FiTrash2, FiSlash, FiUsers } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

const AdminSupportChat = () => {
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)

    // WhatsApp State
    const [whatsappNumber, setWhatsappNumber] = useState('+919876543210')
    const [whatsappMessage, setWhatsappMessage] = useState('Hello, I need support with MD Consultancy app.')
    const [primaryMethod, setPrimaryMethod] = useState('chat')
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
    const [tempNumber, setTempNumber] = useState('')
    const [tempMessage, setTempMessage] = useState('')

    // New Features State
    const [showNewChatModal, setShowNewChatModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [chatSearchQuery, setChatSearchQuery] = useState('') // New: for filtering chats
    const [searchResults, setSearchResults] = useState([])
    const [bulkMode, setBulkMode] = useState('specific') // 'all' or 'specific'
    const [selectedBulkUsers, setSelectedBulkUsers] = useState([])
    const [bulkMessageText, setBulkMessageText] = useState('')
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false)

    const chatEndRef = useRef(null)

    useEffect(() => {
        fetchConversations()
        fetchSettings()
        const interval = setInterval(fetchConversations, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id)
            const interval = setInterval(() => fetchMessages(selectedUser._id), 10000)
            return () => clearInterval(interval)
        }
    }, [selectedUser])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // --- Search Users for New Chat & Bulk (Reusable) ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const res = await axios.get(`/api/users/search?query=${searchQuery}`)
                    if (res.data.success) {
                        setSearchResults(res.data.users)
                    }
                } catch (error) {
                    console.error('Search error:', error)
                }
            } else {
                setSearchResults([])
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])


    // --- Core Chat Functions ---
    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/support/conversations')
            if (res.data.success) {
                setConversations(res.data.conversations)
            }
        } catch (error) {
            console.error('Fetch conversations error:', error)
        } finally {
            setLoadingConversations(false)
        }
    }

    const fetchMessages = async (userId) => {
        if (!userId) return
        try {
            const res = await axios.get(`/api/support/messages?userId=${userId}`)
            if (res.data.success) {
                setMessages(res.data.messages)
            }
        } catch (error) {
            console.error('Fetch messages error:', error)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || !selectedUser) return

        if (selectedUser.isSupportBlocked) {
            alert('This user is blocked. Unblock them to send messages.')
            return
        }

        const messageData = {
            userId: selectedUser._id,
            senderId: user?._id,
            text: inputText,
            isAdmin: true
        }

        setInputText('')
        setMessages([...messages, { ...messageData, createdAt: new Date().toISOString() }])

        try {
            await axios.post('/api/support/send', { ...messageData })
            fetchMessages(selectedUser._id)
            fetchConversations() // Refresh list to bump to top
        } catch (error) {
            console.error('Send message error:', error)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !selectedUser) return

        setUploading(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const res = await axios.post('/api/storage/simple-upload', arrayBuffer, {
                headers: {
                    'Content-Type': file.type,
                    'x-filename': file.name,
                    'x-folder': 'support_chats',
                    'x-mime-type': file.type
                }
            })

            if (res.data.success) {
                await axios.post('/api/support/send', {
                    userId: selectedUser._id,
                    senderId: user?._id,
                    images: [res.data.url],
                    isAdmin: true
                })
                fetchMessages(selectedUser._id)
            }
        } catch (error) {
            console.error('Upload error:', error)
        } finally {
            setUploading(false)
        }
    }

    // --- New Feature Functions ---

    const handleStartNewChat = (user) => {
        const existingConv = conversations.find(c => (c.userDetails?._id || c._id) === user._id)
        if (existingConv) {
            setSelectedUser(existingConv.userDetails || { ...user })
        } else {
            // Optimistically add to list or just set selectedUser
            // We'll set selectedUser, and the first message will create the conversation
            setSelectedUser(user)
        }
        setShowNewChatModal(false)
        setSearchQuery('')
    }

    const handleBulkSend = async () => {
        if (!bulkMessageText.trim()) return
        if (bulkMode === 'specific' && selectedBulkUsers.length === 0) return
        if (bulkMode === 'all' && !confirm('Are you sure you want to send this to ALL students?')) return

        try {
            const payload = {
                text: bulkMessageText,
                sendToAll: bulkMode === 'all',
                userIds: selectedBulkUsers.map(u => u._id)
            }

            setUploading(true) // Reuse loading state for UI feedback
            const res = await axios.post('/api/support/bulk-send', payload)

            if (res.data.success) {
                alert(res.data.message)
                setShowBulkModal(false)
                setBulkMessageText('')
                setSelectedBulkUsers([])
                fetchConversations()
            }
        } catch (error) {
            console.error('Bulk send error:', error)
            alert('Failed to send bulk messages')
        } finally {
            setUploading(false)
        }
    }

    const handleBlockUser = async () => {
        if (!selectedUser) return
        if (!confirm(`Are you sure you want to ${selectedUser.isSupportBlocked ? 'unblock' : 'block'} this user?`)) return

        try {
            const res = await axios.post('/api/support/block-user', {
                userId: selectedUser._id,
                blocked: !selectedUser.isSupportBlocked
            })
            if (res.data.success) {
                setSelectedUser(prev => ({ ...prev, isSupportBlocked: res.data.isSupportBlocked }))
                fetchConversations() // Update list if needed
            }
        } catch (error) {
            console.error('Block error:', error)
        }
    }

    const handleDeleteConversation = async () => {
        if (!selectedUser) return
        if (!confirm('Are you sure? This will delete all messages in this conversation permanently.')) return

        try {
            const res = await axios.delete(`/api/support/delete-conversation?userId=${selectedUser._id}`)
            if (res.data.success) {
                setConversations(conversations.filter(c => (c.userDetails?._id || c._id) !== selectedUser._id))
                setSelectedUser(null)
                setMessages([])
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    // --- WhatsApp Settings ---
    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings')
            if (res.data.success && res.data.data?.whatsappSupport) {
                const ws = res.data.data.whatsappSupport
                setWhatsappNumber(ws.phoneNumber || '+919876543210')
                setWhatsappMessage(ws.message || 'Hello, I need support.')
                setPrimaryMethod(ws.primaryMethod || 'chat')
            }
        } catch (error) { console.error(error) }
    }

    const handleSaveSettings = async (updates) => {
        try {
            await axios.put('/api/settings', {
                tab: 'whatsapp-support',
                data: {
                    phoneNumber: updates.phoneNumber || whatsappNumber,
                    message: updates.message || whatsappMessage,
                    primaryMethod: updates.primaryMethod || primaryMethod,
                    enabled: true
                }
            })
            if (updates.phoneNumber) setWhatsappNumber(updates.phoneNumber)
            if (updates.message) setWhatsappMessage(updates.message)
            if (updates.primaryMethod) setPrimaryMethod(updates.primaryMethod)
        } catch (error) { console.error(error) }
    }

    const handleOpenWhatsApp = () => {
        setTempNumber(whatsappNumber)
        setTempMessage(whatsappMessage)
        setShowWhatsAppModal(true)
    }

    const handleSaveWhatsAppSettings = async () => {
        await handleSaveSettings({ phoneNumber: tempNumber, message: tempMessage })
        alert('WhatsApp settings saved!')
    }

    const handleSendWhatsApp = () => {
        handleSaveSettings({ phoneNumber: tempNumber, message: tempMessage })
        const url = `https://wa.me/${tempNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(tempMessage)}`
        window.open(url, '_blank')
        setShowWhatsAppModal(false)
    }

    // Helper to render Avatar
    const renderAvatar = (user) => {
        if (user.profileImage) {
            return (
                <img
                    src={user.profileImage}
                    alt={user.name}
                    className="avatar-sm rounded-circle me-3"
                    style={{ objectFit: 'cover' }}
                />
            )
        }
        return (
            <div className="avatar-sm me-3">
                <span className={`avatar-title rounded-circle ${user.isSupportBlocked ? 'bg-danger text-white' : 'bg-primary-soft text-primary'}`}>
                    {(user.name || 'U').charAt(0)}
                </span>
            </div>
        )
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = format(new Date(message.createdAt), 'yyyy-MM-dd')
        if (!groups[date]) groups[date] = []
        groups[date].push(message)
        return groups
    }, {})

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const user = conv.userDetails || { name: '', email: '' };
        const query = chatSearchQuery.toLowerCase();
        return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });

    return (
        <div className="card stretch stretch-full" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="row g-0 h-100">
                {/* --- Sidebar: Conversations --- */}
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
                                            {renderAvatar(user)}
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

                {/* --- Main Chat Area --- */}
                <div className="col-md-9 h-100 d-flex flex-column">
                    {selectedUser ? (
                        <>
                            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
                                <div className="d-flex align-items-center">
                                    {renderAvatar(selectedUser)}
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
            </div>

            {/* --- Modals --- */}

            {/* New Chat Modal */}
            {showNewChatModal && (
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
                                                {renderAvatar(user)}
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
            )}

            {/* Bulk Message Modal */}
            {showBulkModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Bulk Message</h5>
                                <button type="button" className="btn-close" onClick={() => setShowBulkModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Recipients</label>
                                    <div className="d-flex gap-3 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input" type="radio"
                                                checked={bulkMode === 'specific'} onChange={() => setBulkMode('specific')}
                                            />
                                            <label className="form-check-label">Specific Students</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input" type="radio"
                                                checked={bulkMode === 'all'} onChange={() => setBulkMode('all')}
                                            />
                                            <label className="form-check-label">All Students</label>
                                        </div>
                                    </div>

                                    {bulkMode === 'specific' && (
                                        <div className="mb-3">
                                            <input
                                                type="text" className="form-control mb-2"
                                                placeholder="Search to add students..."
                                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            {/* Selected Pills */}
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {selectedBulkUsers.map(u => (
                                                    <span key={u._id} className="badge bg-light text-dark border d-flex align-items-center">
                                                        {u.name} <span className="ms-2 cursor-pointer" onClick={() => setSelectedBulkUsers(prev => prev.filter(x => x._id !== u._id))}>&times;</span>
                                                    </span>
                                                ))}
                                            </div>
                                            {/* Search Results */}
                                            {searchResults.length > 0 && searchQuery.length >= 2 && (
                                                <div className="list-group" style={{ maxHeight: '150px', overflow: 'auto' }}>
                                                    {searchResults.map(user => (
                                                        <button
                                                            key={user._id} className="list-group-item list-group-item-action p-2"
                                                            onClick={() => {
                                                                if (!selectedBulkUsers.find(u => u._id === user._id)) {
                                                                    setSelectedBulkUsers([...selectedBulkUsers, user])
                                                                }
                                                                setSearchQuery('')
                                                                setSearchResults([])
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <small className="fw-bold me-2">{user.name}</small>
                                                                <small className="text-muted">{user.email}</small>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control" rows="4"
                                        value={bulkMessageText} onChange={(e) => setBulkMessageText(e.target.value)}
                                        placeholder="Type your message here..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                                <button
                                    type="button" className="btn btn-primary"
                                    onClick={handleBulkSend}
                                    disabled={!bulkMessageText || (bulkMode === 'specific' && selectedBulkUsers.length === 0)}
                                >
                                    {uploading ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Modal */}
            {showWhatsAppModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title d-flex align-items-center gap-2">
                                    <FaWhatsapp size={24} className="text-success" />
                                    WhatsApp Support
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowWhatsAppModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input type="text" className="form-control" placeholder="+91 9876543210" value={tempNumber} onChange={(e) => setTempNumber(e.target.value)} />
                                    <small className="text-muted">Include country code</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea className="form-control" rows="4" placeholder="Enter message..." value={tempMessage} onChange={(e) => setTempMessage(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowWhatsAppModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveWhatsAppSettings}>Save Settings</button>
                                <button type="button" className="btn btn-success" onClick={handleSendWhatsApp} disabled={!tempNumber || !tempMessage}>
                                    <FaWhatsapp className="me-2" /> Open WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSupportChat
