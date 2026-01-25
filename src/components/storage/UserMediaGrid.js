import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import UserSelfiesModal from './UserSelfiesModal';

const UserMediaGrid = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage/users');
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-5">
                <i className="fas fa-users-slash fa-3x text-muted mb-3"></i>
                <h5>No Users Found with Media</h5>
                <p className="text-muted">Users who have uploaded selfies or have media will appear here.</p>
            </div>
        );
    }

    return (
        <>
            <div className="row">
                {users.map(user => (
                    <UserCard
                        key={user._id}
                        user={user}
                        onClick={handleUserClick}
                    />
                ))}
            </div>

            <UserSelfiesModal
                user={selectedUser}
                show={showModal}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default UserMediaGrid;
