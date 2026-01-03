'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { FiImage, FiSend, FiMessageSquare, FiSearch } from 'react-icons/fi'

const AdminSupportChat = () => {
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const chatEndRef = useRef(null)

    useEffect(() => {
        fetchConversations()
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
                        <h6 className="mb-0">Support Conversations</h6>
                    </div>
                    <div className="list-group list-group-flush">
                        {conversations.map((conv) => (
                            <button
                                key={conv._id}
                                onClick={() => setSelectedUser(conv.userDetails)}
                                className={`list-group-item list-group-item-action p-3 ${selectedUser?._id === conv._id ? 'active' : ''}`}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm me-3">
                                            <span className="avatar-title rounded-circle bg-primary-soft text-primary">
                                                {conv.userDetails.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h6 className="mb-0">{conv.userDetails.name}</h6>
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
                        ))}
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
        </div>
    )
}

export default AdminSupportChat
