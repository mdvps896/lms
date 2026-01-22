'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import notificationSound from '@/utils/notificationSound';


// fygshdjiwref


export default function ChatBox({ attemptId, examId, onClose }) {
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatBlocked, setChatBlocked] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const chatIntervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const previousMessageCountRef = useRef(0);

    // Fetch chat messages
    const fetchChatMessages = async () => {
        if (!attemptId || !examId) return;

        try {
            const response = await fetch(
                `/api/exams/chat?attemptId=${attemptId}&examId=${examId}`
            );
            const data = await response.json();

            if (response.ok) {
                const newMessages = data.messages || [];

                // Check if there are new messages from student
                if (newMessages.length > previousMessageCountRef.current) {
                    const latestMessage = newMessages[newMessages.length - 1];

                    // Play sound only if latest message is from student
                    if (latestMessage && latestMessage.sender === 'student') {
                        notificationSound.playChatNotification();
                    }
                }

                previousMessageCountRef.current = newMessages.length;
                setChatMessages(newMessages);
                setChatBlocked(data.chatBlocked || false);
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('/api/exams/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    examId,
                    sender: 'admin',
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchChatMessages();
                toast.success('Message sent!');
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    // Block/Unblock chat
    const handleBlockChat = async (blocked) => {
        setIsBlocking(true);
        try {
            const response = await fetch('/api/exams/block-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    examId,
                    blocked
                })
            });

            if (response.ok) {
                toast.success(blocked ? 'Chat blocked!' : 'Chat unblocked!');
                setChatBlocked(blocked);
                fetchChatMessages();
            } else {
                toast.error('Failed to update chat status');
            }
        } catch (error) {
            console.error('Error blocking chat:', error);
            toast.error('Error updating chat status');
        } finally {
            setIsBlocking(false);
        }
    };

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Poll for new messages
    useEffect(() => {
        fetchChatMessages();
        chatIntervalRef.current = setInterval(fetchChatMessages, 3000);

        return () => {
            if (chatIntervalRef.current) {
                clearInterval(chatIntervalRef.current);
            }
        };
    }, [attemptId, examId]);

    return (
        <div className="card h-100">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                    <i className="bi bi-chat-dots me-2"></i>
                    Chat with Student
                </h6>
                <div className="btn-group btn-group-sm">
                    <button
                        className={`btn ${chatBlocked ? 'btn-warning' : 'btn-outline-light'}`}
                        onClick={() => handleBlockChat(!chatBlocked)}
                        title={chatBlocked ? 'Unblock Chat' : 'Block Chat'}
                        disabled={isBlocking}
                    >
                        {isBlocking ? (
                            // Loading Spinner
                            <span className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </span>
                        ) : chatBlocked ? (
                            // Unlock SVG
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H3z" />
                            </svg>
                        ) : (
                            // Lock SVG
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className="card-body p-0 d-flex flex-column" style={{ height: '400px' }}>
                {/* Messages Area */}
                <div
                    className="flex-grow-1 p-3 overflow-auto"
                    style={{ backgroundColor: '#f8f9fa' }}
                >
                    {chatMessages.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-chat-text fs-1 mb-3 d-block"></i>
                            <p>No messages yet</p>
                        </div>
                    ) : (
                        <>
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`mb-3 ${msg.sender === 'admin' ? 'text-end' : 'text-start'}`}
                                >
                                    <div
                                        className={`d-inline-block p-2 rounded ${msg.sender === 'admin'
                                            ? 'bg-primary text-white'
                                            : 'bg-light text-dark'
                                            }`}
                                        style={{ maxWidth: '75%' }}
                                    >
                                        <small className="d-block opacity-75 mb-1">
                                            {msg.sender === 'admin' ? 'You (Admin)' : 'Student'}
                                        </small>
                                        <div>{msg.message}</div>
                                        <small className="d-block opacity-75 mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </small>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-top">
                    {chatBlocked && (
                        <div className="alert alert-warning alert-sm mb-2">
                            <i className="bi bi-lock me-2"></i>
                            Chat is blocked. Student cannot reply.
                        </div>
                    )}
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <i className="bi bi-send"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
