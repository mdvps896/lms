'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import notificationSound from '@/utils/notificationSound';

export default function ExamChatBox({ attemptId, examId, recordingStarted }) {
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatBlocked, setChatBlocked] = useState(false);
    const chatIntervalRef = useRef(null);
    const previousChatCountRef = useRef(0);

    // Fetch chat messages
    const fetchChatMessages = async () => {
        try {
            const response = await fetch(
                `/api/exams/chat?attemptId=${attemptId}&examId=${examId}`
            );
            const data = await response.json();

            if (response.ok) {
                const newMessages = data.messages || [];

                // Check if there are new messages from admin
                if (newMessages.length > previousChatCountRef.current) {
                    const latestMessage = newMessages[newMessages.length - 1];

                    // Play sound only if latest message is from admin
                    if (latestMessage && latestMessage.sender === 'admin') {
                        notificationSound.playChatNotification();
                    }
                }

                previousChatCountRef.current = newMessages.length;
                setChatMessages(newMessages);
                setChatBlocked(data.chatBlocked || false);

                // Count unread messages from admin
                const unread = newMessages.filter(
                    msg => msg.sender === 'admin' && !msg.read
                ).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    // Send chat message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || chatBlocked) return;

        try {
            const response = await fetch('/api/exams/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    examId,
                    sender: 'student',
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchChatMessages();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    // Open chat modal and mark messages as read
    const handleOpenChat = () => {
        setShowChatModal(true);
        setUnreadCount(0);
        fetchChatMessages();
    };

    // Poll for new messages every 5 seconds
    useEffect(() => {
        if (recordingStarted && attemptId && examId) {
            fetchChatMessages();
            chatIntervalRef.current = setInterval(fetchChatMessages, 5000);
        }

        return () => {
            if (chatIntervalRef.current) {
                clearInterval(chatIntervalRef.current);
            }
        };
    }, [recordingStarted, attemptId, examId]);

    if (!recordingStarted) return null;

    return (
        <>
            {/* Floating Help Button */}
            <button
                className="btn btn-primary rounded-circle position-fixed d-flex align-items-center justify-content-center"
                style={{
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: 'none'
                }}
                onClick={handleOpenChat}
                title="Help & Support"
            >
                {/* Chat SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    fill="white"
                    viewBox="0 0 16 16"
                >
                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                    <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>

                {unreadCount > 0 && (
                    <span
                        className="position-absolute badge rounded-pill bg-danger"
                        style={{
                            top: '-5px',
                            right: '-5px',
                            fontSize: '12px',
                            minWidth: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Modal */}
            {showChatModal && (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-primary">
                                    <h5 className="modal-title text-white">
                                        <i className="bi bi-chat-dots me-2"></i>
                                        <span className="text-white">Help & Support</span>
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowChatModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-0">
                                    {/* Chat Messages */}
                                    <div
                                        className="chat-messages p-3"
                                        style={{
                                            height: '400px',
                                            overflowY: 'auto',
                                            backgroundColor: '#f8f9fa'
                                        }}
                                    >
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-muted py-5">
                                                <i className="bi bi-chat-text fs-1 mb-3 d-block"></i>
                                                <p>No messages yet. Admin will send warnings and messages here.</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, index) => (
                                                <div
                                                    key={index}
                                                    className={`mb-3 ${msg.sender === 'admin' ? 'text-start' : 'text-end'}`}
                                                >
                                                    <div
                                                        className={`d-inline-block p-2 rounded ${msg.sender === 'admin'
                                                            ? 'bg-light text-dark'
                                                            : 'bg-primary text-white'
                                                            }`}
                                                        style={{ maxWidth: '75%' }}
                                                    >
                                                        <small className="d-block opacity-75 mb-1">
                                                            {msg.sender === 'admin' ? 'Admin' : 'You'}
                                                        </small>
                                                        <div>{msg.message}</div>
                                                        <small className="d-block opacity-75 mt-1">
                                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                                        </small>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-3 border-top">
                                        {chatBlocked ? (
                                            <div className="alert alert-warning mb-0">
                                                <i className="bi bi-lock me-2"></i>
                                                Chat has been blocked by admin. You cannot send messages.
                                            </div>
                                        ) : (
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Type your message..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                    disabled={chatBlocked}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleSendMessage}
                                                    disabled={!newMessage.trim() || chatBlocked}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                                                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
}
