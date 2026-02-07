import React, { useState, useEffect } from 'react';
import { X, Search, Mail, Users, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const NewChatModal = ({ onClose, onConversationCreated }) => {
    const { user } = useAuth();
    const [mode, setMode] = useState('select'); // 'select' | 'dm' | 'group'
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupName, setGroupName] = useState('');
    const [externalEmail, setExternalEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setError(null);
            // Get all users from workspaces the current user is in
            const workspacesResponse = await api.get('/workspaces');

            if (!workspacesResponse.data || !Array.isArray(workspacesResponse.data)) {
                console.error('Invalid workspaces response:', workspacesResponse.data);
                setError('Failed to load users');
                return;
            }

            const allUsers = new Set();

            workspacesResponse.data.forEach(workspace => {
                if (workspace.users && Array.isArray(workspace.users)) {
                    workspace.users.forEach(u => {
                        // Check if user object exists and has required fields
                        if (u.user && u.user._id && u.user._id !== user._id) {
                            allUsers.add(JSON.stringify({
                                _id: u.user._id,
                                name: u.user.name || 'Unknown User',
                                email: u.user.email || ''
                            }));
                        }
                    });
                }
            });

            const usersList = Array.from(allUsers).map(u => JSON.parse(u));
            console.log('Fetched users:', usersList);
            setUsers(usersList);

            if (usersList.length === 0) {
                setError('No users found in your workspaces');
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            console.error('Error details:', err.response?.data);
            setError(err.response?.data?.error || 'Failed to load users');
        }
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateDM = async () => {
        if (selectedUsers.length !== 1) {
            setError('Please select exactly one user for a direct message');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/conversations', {
                type: 'DIRECT',
                participants: selectedUsers
            });
            onConversationCreated(response.data);
        } catch (err) {
            console.error('Create DM error:', err);
            setError(err.response?.data?.error || 'Failed to create direct message');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (selectedUsers.length === 0) {
            setError('Please select at least one user');
            return;
        }

        if (!groupName.trim()) {
            setError('Please enter a group name');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/conversations', {
                type: 'GROUP',
                participants: selectedUsers,
                name: groupName.trim()
            });

            // If external email is provided, send invitation
            if (externalEmail.trim()) {
                try {
                    await api.post(`/conversations/${response.data._id}/invite`, {
                        email: externalEmail.trim()
                    });
                } catch (inviteErr) {
                    console.error('Invite error:', inviteErr);
                    // Don't fail the whole operation if invite fails
                }
            }

            onConversationCreated(response.data);
        } catch (err) {
            console.error('Create group error:', err);
            setError(err.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (mode === 'select') {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#1a2332] border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-white">New Chat</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => setMode('dm')}
                            className="w-full p-4 bg-[#0B1220] hover:bg-[#0B1220]/70 border border-gray-700/50 rounded-lg transition-colors flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-medium">Direct Message</h4>
                                <p className="text-sm text-gray-400">Start a 1-on-1 conversation</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('group')}
                            className="w-full p-4 bg-[#0B1220] hover:bg-[#0B1220]/70 border border-gray-700/50 rounded-lg transition-colors flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-medium">Group Chat</h4>
                                <p className="text-sm text-gray-400">Create a group with multiple people</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a2332] border border-gray-700/50 rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                        {mode === 'dm' ? 'New Direct Message' : 'New Group Chat'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {mode === 'group' && (
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                        {mode === 'dm' ? 'Select User' : 'Select Members'}
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {selectedUsers.map(userId => {
                            const selectedUser = users.find(u => u._id === userId);
                            return selectedUser ? (
                                <span
                                    key={userId}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                                >
                                    {selectedUser.name}
                                    <button
                                        onClick={() => handleUserToggle(userId)}
                                        className="hover:text-blue-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ) : null;
                        })}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto mb-4 border border-gray-700/50 rounded-lg">
                    {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            No users found
                        </div>
                    ) : (
                        filteredUsers.map(u => (
                            <button
                                key={u._id}
                                onClick={() => handleUserToggle(u._id)}
                                className={`w-full p-3 text-left hover:bg-[#0B1220]/50 transition-colors flex items-center gap-3 ${selectedUsers.includes(u._id) ? 'bg-blue-600/10' : ''
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-medium">
                                        {u.name[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                                    <p className="text-gray-400 text-xs truncate">{u.email}</p>
                                </div>
                                {selectedUsers.includes(u._id) && (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {mode === 'group' && (
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Invite External User (Optional)
                        </label>
                        <input
                            type="email"
                            value={externalEmail}
                            onChange={(e) => setExternalEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            They'll receive an email invitation to join
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={mode === 'dm' ? handleCreateDM : handleCreateGroup}
                        disabled={loading || selectedUsers.length === 0}
                        className="flex-1 px-4 py-2 bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all"
                    >
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
