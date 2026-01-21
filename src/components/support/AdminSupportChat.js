'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { FiImage, FiSend, FiMessageSquare, FiSearch } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

const AdminSupportChat = () => {
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [whatsappNumber, setWhatsappNumber] = useState('+919876543210')
    const [whatsappMessage, setWhatsappMessage] = useState('Hello, I need support with MD Consultancy app.')
    const [primaryMethod, setPrimaryMethod] = useState('chat')
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
    const [tempNumber, setTempNumber] = useState('')
    const [tempMessage, setTempMessage] = useState('')
    const chatEndRef = useRef(null)

    useEffect(() => {
        fetchConversations()
        fetchSettings()
        // Poll for new messages every 30 seconds
        const interval = setInterval(fetchConversations, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id)
            // Poll for messages in active chat
            const interval = setInterval(() => fetchMessages(selectedUser._id), 10000)
            return () => clearInterval(interval)
        }
    }, [selectedUser])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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

        const messageData = {
            userId: selectedUser._id,
            senderId: user?._id,
            text: inputText,
            isAdmin: true
        }

        setInputText('')
        // Optimistic update
        setMessages([...messages, { ...messageData, createdAt: new Date().toISOString() }])

        try {
            await axios.post('/api/support/send', {
                ...messageData,
                senderId: user?._id
            })
            fetchMessages(selectedUser._id)
        } catch (error) {
            console.error('Send message error:', error)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !selectedUser) return

        setUploading(true)
        try {
            // Use simple-upload
            const formData = new FormData()
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

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings')
            if (res.data.success && res.data.data) {
                const settings = res.data.data
                if (settings.whatsappSupport) {
                    setWhatsappNumber(settings.whatsappSupport.phoneNumber || '+919876543210')
                    setWhatsappMessage(settings.whatsappSupport.message || 'Hello, I need support with MD Consultancy app.')
                    setPrimaryMethod(settings.whatsappSupport.primaryMethod || 'chat')
                }
            }
        } catch (error) {
            console.error('Fetch settings error:', error)
        }
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

            // Update local state
            if (updates.phoneNumber) setWhatsappNumber(updates.phoneNumber)
            if (updates.message) setWhatsappMessage(updates.message)
            if (updates.primaryMethod) setPrimaryMethod(updates.primaryMethod)

        } catch (error) {
            console.error('Save settings error:', error)
        }
    }

    const handleOpenWhatsApp = () => {
        setTempNumber(whatsappNumber)
        setTempMessage(whatsappMessage)
        setShowWhatsAppModal(true)
    }

    const handleSendWhatsApp = () => {
        const message = encodeURIComponent(tempMessage)
        const number = tempNumber.replace(/[^0-9]/g, '')
        const whatsappUrl = `https://wa.me/${number}?text=${message}`

        // Save to DB and State
        handleSaveSettings({
            phoneNumber: tempNumber,
            message: tempMessage
        })

        window.open(whatsappUrl, '_blank')
        setShowWhatsAppModal(false)
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = format(new Date(message.createdAt), 'yyyy-MM-dd')
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    return (
        <div className="card stretch stretch-full" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="row g-0 h-100">
                {/* Conversations List */}
                <div className="col-md-4 border-end h-100 overflow-auto">
                    <div className="p-3 border-bottom sticky-top bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Support Conversations</h6>
                        </div>

                        {/* Support Type Selector */}
                        <div className="mb-3">
                            <label className="form-label small text-muted">Primary Support Method</label>
                            <select
                                className="form-select"
                                value={primaryMethod}
                                onChange={(e) => {
                                    const newVal = e.target.value
                                    if (newVal === 'whatsapp') {
                                        handleOpenWhatsApp()
                                    }
                                    setPrimaryMethod(newVal)
                                    handleSaveSettings({ primaryMethod: newVal })
                                }}
                            >
                                <option value="chat">💬 Default Chat</option>
                                <option value="whatsapp">📱 WhatsApp Support</option>
                            </select>
                        </div>
                    </div>
                    <div className="list-group list-group-flush">
                        {conversations.map((conv) => {
                            const user = conv.userDetails || { _id: conv._id, name: 'Unknown User', email: 'N/A' };
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`list-group-item list-group-item-action p-3 ${selectedUser?._id === user._id ? 'active' : ''}`}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm me-3">
                                                <span className="avatar-title rounded-circle bg-primary-soft text-primary">
                                                    {(user.name || 'U').charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <h6 className="mb-0">{user.name}</h6>
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
                        {conversations.length === 0 && !loadingConversations && (
                            <div className="p-4 text-center text-muted">No conversations found</div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-md-8 h-100 d-flex flex-column">
                    {selectedUser ? (
                        <>
                            <div className="p-3 border-bottom d-flex align-items-center bg-white">
                                <div className="avatar-sm me-3">
                                    <span className="avatar-title rounded-circle bg-primary text-white">
                                        {selectedUser.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h6 className="mb-0">{selectedUser.name}</h6>
                                    <small className="text-muted">{selectedUser.email}</small>
                                </div>
                            </div>

                            <div className="flex-grow-1 overflow-auto p-4 bg-light">
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
                        </>
                    ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center text-muted flex-column">
                            <FiMessageSquare size={60} className="mb-3 opacity-25" />
                            <p className="fw-medium">Select a user to start chatting</p>
                            <small>Real-time support messages from students appear here</small>
                        </div>
                    )}
                </div>
            </div>

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
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowWhatsAppModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="+91 9876543210"
                                        value={tempNumber}
                                        onChange={(e) => setTempNumber(e.target.value)}
                                    />
                                    <small className="text-muted">Include country code (e.g., +91 for India)</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Enter your message..."
                                        value={tempMessage}
                                        onChange={(e) => setTempMessage(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowWhatsAppModal(false)
                                        // User wants to use default chat instead
                                    }}
                                >
                                    Use Default Chat
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success d-flex align-items-center gap-2"
                                    onClick={handleSendWhatsApp}
                                    disabled={!tempNumber || !tempMessage}
                                >
                                    <FaWhatsapp size={18} />
                                    Open WhatsApp
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
