'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

// Holds all state, effects and handlers for AdminSupportChat.
const useAdminSupportChat = () => {
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
    const [allStudents, setAllStudents] = useState([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false)

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
    const fetchAllStudents = async () => {
        if (allStudents.length > 0) return;
        setLoadingStudents(true);
        try {
            const res = await axios.get('/api/users?role=student');
            if (res.data.success) {
                setAllStudents(res.data.data);
                // Initial search results = all students
                setSearchResults(res.data.data);
            }
        } catch (error) {
            console.error('Fetch students error:', error);
            alert('Failed to load students list');
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        // If Bulk Mode is OPEN, filter local 'allStudents'
        if (showBulkModal && bulkMode === 'specific') {
            if (allStudents.length === 0) {
                // Trigger fetch if not loaded (though button click usually does it)
                // fetchAllStudents();
                // Actually relying on button click is safer to avoid instant load on mount
                // But let's filter if we have data
            }

            if (!searchQuery) {
                setSearchResults(allStudents);
            } else {
                const lower = searchQuery.toLowerCase();
                setSearchResults(allStudents.filter(u =>
                    u.name.toLowerCase().includes(lower) ||
                    u.email.toLowerCase().includes(lower)
                ));
            }
            return;
        }

        // Standard Remote Search for "New Chat" modal
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2 && !showBulkModal) {
                try {
                    const res = await axios.get(`/api/users/search?query=${searchQuery}`)
                    if (res.data.success) {
                        setSearchResults(res.data.users)
                    }
                } catch (error) {
                    console.error('Search error:', error)
                }
            } else if (!showBulkModal) {
                setSearchResults([])
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery, showBulkModal, bulkMode, allStudents])


    // --- Core Chat Functions ---
    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/support/conversations')
            if (res.data.success) {
                setConversations(res.data.conversations || [])
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
        const existingConv = (conversations || []).find(c => (c.userDetails?._id || c._id) === user._id)
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
        await handleSaveSettings({
            phoneNumber: tempNumber,
            message: tempMessage,
            primaryMethod: 'whatsapp' // Auto-switch to WhatsApp
        })
        setShowWhatsAppModal(false) // Close modal
        alert('WhatsApp settings saved successfully!')
    }

    const handleSendWhatsApp = () => {
        handleSaveSettings({ phoneNumber: tempNumber, message: tempMessage })
        const url = `https://wa.me/${tempNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(tempMessage)}`
        window.open(url, '_blank')
        setShowWhatsAppModal(false)
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = format(new Date(message.createdAt), 'yyyy-MM-dd')
        if (!groups[date]) groups[date] = []
        groups[date].push(message)
        return groups
    }, {})

    // Filter conversations
    const filteredConversations = (conversations || []).filter(conv => {
        if (!conv) return false;
        const user = conv.userDetails || { name: '', email: '' };
        const query = chatSearchQuery.toLowerCase();
        return (user.name || '').toLowerCase().includes(query) || (user.email || '').toLowerCase().includes(query);
    });

    return {
        selectedUser, setSelectedUser,
        inputText, setInputText,
        uploading,
        loadingConversations,
        primaryMethod,
        showWhatsAppModal, setShowWhatsAppModal,
        tempNumber, setTempNumber,
        tempMessage, setTempMessage,
        showNewChatModal, setShowNewChatModal,
        showBulkModal, setShowBulkModal,
        searchQuery, setSearchQuery,
        chatSearchQuery, setChatSearchQuery,
        searchResults,
        bulkMode, setBulkMode,
        selectedBulkUsers, setSelectedBulkUsers,
        bulkMessageText, setBulkMessageText,
        showOptionsDropdown, setShowOptionsDropdown,
        allStudents,
        loadingStudents,
        isStudentDropdownOpen, setIsStudentDropdownOpen,
        chatEndRef,
        fetchAllStudents,
        handleSendMessage,
        handleImageUpload,
        handleStartNewChat,
        handleBulkSend,
        handleBlockUser,
        handleDeleteConversation,
        handleSaveSettings,
        handleOpenWhatsApp,
        handleSaveWhatsAppSettings,
        handleSendWhatsApp,
        groupedMessages,
        filteredConversations
    }
}

export default useAdminSupportChat
