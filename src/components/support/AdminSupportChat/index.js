'use client'

import React from 'react'
import ConversationSidebar from './ConversationSidebar'
import ChatWindow from './ChatWindow'
import NewChatModal from './NewChatModal'
import BulkMessageModal from './BulkMessageModal'
import WhatsAppModal from './WhatsAppModal'
import useAdminSupportChat from './useAdminSupportChat'

const AdminSupportChat = () => {
    const {
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
    } = useAdminSupportChat()

    return (
        <div className="card stretch stretch-full" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="row g-0 h-100">
                {/* --- Sidebar: Conversations --- */}
                <ConversationSidebar
                    filteredConversations={filteredConversations}
                    loadingConversations={loadingConversations}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    chatSearchQuery={chatSearchQuery}
                    setChatSearchQuery={setChatSearchQuery}
                    primaryMethod={primaryMethod}
                    handleOpenWhatsApp={handleOpenWhatsApp}
                    handleSaveSettings={handleSaveSettings}
                    setShowNewChatModal={setShowNewChatModal}
                    setShowBulkModal={setShowBulkModal}
                />

                {/* --- Main Chat Area --- */}
                <ChatWindow
                    selectedUser={selectedUser}
                    groupedMessages={groupedMessages}
                    chatEndRef={chatEndRef}
                    showOptionsDropdown={showOptionsDropdown}
                    setShowOptionsDropdown={setShowOptionsDropdown}
                    handleBlockUser={handleBlockUser}
                    handleDeleteConversation={handleDeleteConversation}
                    uploading={uploading}
                    handleImageUpload={handleImageUpload}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSendMessage={handleSendMessage}
                />
            </div>

            {/* --- Modals --- */}

            <NewChatModal
                showNewChatModal={showNewChatModal}
                setShowNewChatModal={setShowNewChatModal}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                handleStartNewChat={handleStartNewChat}
            />

            <BulkMessageModal
                showBulkModal={showBulkModal}
                setShowBulkModal={setShowBulkModal}
                bulkMode={bulkMode}
                setBulkMode={setBulkMode}
                allStudents={allStudents}
                fetchAllStudents={fetchAllStudents}
                isStudentDropdownOpen={isStudentDropdownOpen}
                setIsStudentDropdownOpen={setIsStudentDropdownOpen}
                selectedBulkUsers={selectedBulkUsers}
                setSelectedBulkUsers={setSelectedBulkUsers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                loadingStudents={loadingStudents}
                searchResults={searchResults}
                bulkMessageText={bulkMessageText}
                setBulkMessageText={setBulkMessageText}
                handleBulkSend={handleBulkSend}
                uploading={uploading}
            />

            <WhatsAppModal
                showWhatsAppModal={showWhatsAppModal}
                setShowWhatsAppModal={setShowWhatsAppModal}
                tempNumber={tempNumber}
                setTempNumber={setTempNumber}
                tempMessage={tempMessage}
                setTempMessage={setTempMessage}
                handleSaveWhatsAppSettings={handleSaveWhatsAppSettings}
                handleSendWhatsApp={handleSendWhatsApp}
            />
        </div>
    )
}

export default AdminSupportChat
