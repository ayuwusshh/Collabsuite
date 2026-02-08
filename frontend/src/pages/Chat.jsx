import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Plus, Users, Search, X, Mail, MoreVertical, Trash, LogOut, UserMinus, Paperclip, Download, FileText, Image as ImageIcon, Menu, Trash2, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/chat-scroll.css';
import NewChatModal from '../components/NewChatModal';

const Chat = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [isChatListVisible, setIsChatListVisible] = useState(true);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isMountedRef = useRef(true);
    const fileInputRef = useRef(null);
    const settingsMenuRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Initialize socket
    useEffect(() => {
        let socket = null;
        let reconnectAttempts = 0;
        const MAX_RECONNECT_ATTEMPTS = 3;

        try {
            socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
                reconnectionDelay: 1000,
                timeout: 10000
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                if (isMountedRef.current) {
                    setConnected(true);
                    setError(null);
                    socket.emit('join-room', `user_${user._id}`);
                }
            });

            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                reconnectAttempts++;
                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && isMountedRef.current) {
                    setError('Connection lost. Messages may not be delivered.');
                }
            });

            socket.on('new-message', (message) => {
                if (!isMountedRef.current) return;
                if (selectedConversation && message.conversation === selectedConversation._id) {
                    setMessages(prev => [...prev, message]);
                }
                // Update conversation list
                fetchConversations();
            });

            socket.on('conversation-created', (conversation) => {
                if (isMountedRef.current) {
                    setConversations(prev => [conversation, ...prev]);
                }
            });

            socket.on('user-joined-conversation', ({ conversationId, user: newUser }) => {
                if (isMountedRef.current && selectedConversation?._id === conversationId) {
                    fetchMessages(conversationId);
                }
            });

            socket.on('message-deleted', ({ conversationId, messageId }) => {
                if (isMountedRef.current) {
                    setMessages(prev => prev.filter(m => m._id !== messageId));
                }
            });

            socket.on('disconnect', () => {
                if (isMountedRef.current) {
                    setConnected(false);
                }
            });
        } catch (err) {
            console.error('Socket initialization error:', err);
            if (isMountedRef.current) {
                setError('Failed to connect to chat');
            }
        }

        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('connect_error');
                socket.off('new-message');
                socket.off('message-deleted');
                socket.off('conversation-created');
                socket.off('user-joined-conversation');
                socket.off('disconnect');
                socket.disconnect();
            }
            socketRef.current = null;
        };
    }, [user._id, selectedConversation]);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const response = await api.get('/conversations');
            if (isMountedRef.current) {
                setConversations(response.data);
            }
        } catch (err) {
            console.error('Fetch conversations error:', err);
            if (isMountedRef.current) {
                setError('Failed to load conversations');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId) => {
        try {
            const response = await api.get(`/conversations/${conversationId}/messages`);
            if (isMountedRef.current) {
                setMessages(response.data);
            }
        } catch (err) {
            console.error('Fetch messages error:', err);
            if (isMountedRef.current) {
                setError('Failed to load messages');
            }
        }
    };

    useEffect(() => {
        fetchConversations();

        // Handle invitation link
        const joinConversationId = searchParams.get('join');
        if (joinConversationId) {
            handleAcceptInvitation(joinConversationId);
        }
    }, [searchParams]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedConversation && socketRef.current) {
            socketRef.current.emit('join-conversation', selectedConversation._id);
            fetchMessages(selectedConversation._id);

            return () => {
                if (socketRef.current) {
                    socketRef.current.emit('leave-conversation', selectedConversation._id);
                }
            };
        }
    }, [selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleAcceptInvitation = async (conversationId) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/accept`);
            if (isMountedRef.current) {
                setConversations(prev => [response.data, ...prev]);
                setSelectedConversation(response.data);
            }
        } catch (err) {
            console.error('Accept invitation error:', err);
            if (isMountedRef.current) {
                setError('Failed to accept invitation');
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage) return;

        if (trimmedMessage.length > 5000) {
            setError('Message is too long. Maximum 5000 characters.');
            return;
        }

        if (!selectedConversation) {
            setError('Please select a conversation');
            return;
        }

        if (!socketRef.current || !connected) {
            setError('Cannot send message. Not connected to chat.');
            return;
        }

        try {
            await api.post('/conversations/messages', {
                conversationId: selectedConversation._id,
                content: trimmedMessage
            });

            // Don't add message locally - socket will broadcast it to everyone including sender
            if (isMountedRef.current) {
                setNewMessage('');
            }
        } catch (err) {
            console.error('Send message error:', err);
            if (isMountedRef.current) {
                setError('Failed to send message. Please try again.');
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !selectedConversation) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            await api.post(`/conversations/${selectedConversation._id}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Clear selected file
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error('File upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadFile = async (messageId, filename) => {
        try {
            const response = await api.get(`/conversations/files/${messageId}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download file');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) {
            return <ImageIcon className="w-8 h-8 text-green-400" />;
        }
        if (mimeType?.includes('pdf')) {
            return (
                <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                </div>
            );
        }
        if (mimeType?.includes('word') || mimeType?.includes('document')) {
            return (
                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                </div>
            );
        }
        if (mimeType?.includes('sheet') || mimeType?.includes('excel')) {
            return (
                <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-400" />
                </div>
            );
        }
        if (mimeType?.includes('zip') || mimeType?.includes('compressed')) {
            return (
                <div className="w-8 h-8 bg-yellow-500/20 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-yellow-400" />
                </div>
            );
        }
        return (
            <div className="w-8 h-8 bg-gray-500/20 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
            </div>
        );
    };

    const getConversationName = (conversation) => {
        if (conversation.name) return conversation.name;
        if (conversation.type === 'DIRECT') {
            const otherUser = conversation.participants.find(p => p._id !== user._id);
            return otherUser?.name || 'Unknown User';
        }
        return 'Unnamed Group';
    };

    const handleLeaveGroup = async () => {
        if (!selectedConversation) return;

        if (!confirm('Are you sure you want to leave this group?')) return;

        try {
            await api.post(`/conversations/${selectedConversation._id}/leave`);
            setConversations(prev => prev.filter(c => c._id !== selectedConversation._id));
            setSelectedConversation(null);
            setShowSettingsMenu(false);
        } catch (err) {
            console.error('Leave group error:', err);
            setError(err.response?.data?.error || 'Failed to leave group');
        }
    };

    const handleDeleteGroup = async () => {
        if (!selectedConversation) return;

        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

        try {
            await api.delete(`/conversations/${selectedConversation._id}`);
            setConversations(prev => prev.filter(c => c._id !== selectedConversation._id));
            setSelectedConversation(null);
            setShowSettingsMenu(false);
        } catch (err) {
            console.error('Delete group error:', err);
            setError(err.response?.data?.error || 'Failed to delete group');
        }
    };

    const isAdmin = () => {
        if (!selectedConversation || !user) return false;
        return selectedConversation.admins?.some(a => a._id === user._id || a === user._id);
    };

    // Close settings menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
                setShowSettingsMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteChat = async (conversationId, e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation? It will be removed from your chat list.')) return;

        try {
            await api.delete(`/conversations/${conversationId}/hide`);
            setConversations(prev => prev.filter(c => c._id !== conversationId));
            if (selectedConversation?._id === conversationId) {
                setSelectedConversation(null);
            }
        } catch (err) {
            console.error('Delete chat error:', err);
            setError(err.response?.data?.error || 'Failed to delete chat');
        }
    };

    const handleUnsendMessage = async (messageId) => {
        if (!confirm('Unsend this message? It will be deleted for everyone.')) return;

        try {
            await api.delete(`/conversations/${selectedConversation._id}/messages/${messageId}`);
            // Message will be removed via socket event
        } catch (err) {
            console.error('Unsend message error:', err);
            setError(err.response?.data?.error || 'Failed to unsend message');
        }
    };

    const canUnsendMessage = (message) => {
        if (message.sender._id !== user._id) return false;
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return messageAge <= fifteenMinutes;
    };

    const filteredConversations = conversations.filter(conv =>
        getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex gap-4 relative">
            {/* Back Button - Mobile Only (when conversation selected) */}
            {selectedConversation && (
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a2332] border border-gray-700/50 rounded-lg text-white"
                    title="Back to conversations"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}

            {/* Hamburger Menu - Tablet Only */}
            <button
                onClick={() => setIsChatListVisible(!isChatListVisible)}
                className="hidden sm:block lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a2332] border border-gray-700/50 rounded-lg text-white"
                title="Toggle chat list"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Conversations Sidebar */}
            <div className={`
                w-full sm:w-80 lg:w-80
                ${!selectedConversation ? 'block' : 'hidden'} sm:${isChatListVisible ? 'block' : 'hidden'} lg:block
                bg-[#1a2332]/40 backdrop-blur-sm border border-gray-700/40 rounded-xl flex flex-col
                h-full
            `}>
                <div className="p-4 border-b border-gray-700/40">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-white">Messages</h2>
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                            title="New Chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <MessageSquare className="w-12 h-12 text-gray-600 mb-2" />
                            <p className="text-gray-400 text-sm">No conversations yet</p>
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="mt-3 px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                            >
                                Start a Chat
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <div key={conversation._id} className="relative group">
                                <button
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`w-full p-4 text-left border-b border-gray-700/40 hover:bg-[#0B1220]/50 transition-colors ${selectedConversation?._id === conversation._id ? 'bg-[#0B1220]/70' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            {conversation.type === 'DIRECT' ? (
                                                <span className="text-white font-medium">
                                                    {getConversationName(conversation)[0].toUpperCase()}
                                                </span>
                                            ) : (
                                                <Users className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-white font-medium text-sm truncate">
                                                    {getConversationName(conversation)}
                                                </h3>
                                                {conversation.lastMessage && (
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(conversation.updatedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {conversation.participants.length} members
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Delete chat button */}
                                <button
                                    onClick={(e) => handleDeleteChat(conversation._id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className={`
                flex-1 
                ${selectedConversation ? 'flex' : 'hidden'} sm:flex
                bg-[#1a2332]/40 backdrop-blur-sm border border-gray-700/40 rounded-xl 
                flex-col
                overflow-hidden
                min-h-0
                max-h-full
            `}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 m-4 flex items-center gap-2">
                        <span className="text-red-400 text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {selectedConversation ? (
                    <>
                        <div className="flex-shrink-0 p-4 border-b border-gray-700/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        {getConversationName(selectedConversation)}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm text-gray-400">
                                            {selectedConversation.participants.length} members
                                        </span>
                                    </div>
                                </div>

                                {/* Settings menu for groups */}
                                {selectedConversation.type !== 'DIRECT' && (
                                    <div className="relative" ref={settingsMenuRef}>
                                        <button
                                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                                            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                                            title="Group settings"
                                        >
                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                        </button>

                                        {/* Settings dropdown */}
                                        {showSettingsMenu && (
                                            <div className="absolute right-0 mt-2 w-56 bg-[#1a2332] border border-gray-700/50 rounded-xl shadow-xl z-50 overflow-hidden">
                                                <div className="p-2">
                                                    <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                                                        GROUP SETTINGS
                                                    </div>

                                                    {/* View Members */}
                                                    <button
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                        <span>View Members ({selectedConversation.participants.length})</span>
                                                    </button>

                                                    {/* Admin-only options */}
                                                    {isAdmin() && (
                                                        <>
                                                            <div className="my-1 border-t border-gray-700/50"></div>
                                                            <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                                                                ADMIN ACTIONS
                                                            </div>

                                                            <button
                                                                onClick={handleDeleteGroup}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                                <span>Delete Group</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Leave group (all members) */}
                                                    <div className="my-1 border-t border-gray-700/50"></div>
                                                    <button
                                                        onClick={handleLeaveGroup}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>Leave Group</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-6 min-h-0 smooth-scroll"
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                                    <p className="text-gray-400">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => {
                                        const isOwnMessage = message.sender._id === user._id;
                                        return (
                                            <div
                                                key={message._id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                                            >
                                                <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]">
                                                    <div
                                                        className={`${isOwnMessage
                                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                                            : 'bg-[#0B1220]'
                                                            } rounded-lg p-4`}
                                                    >
                                                        {!isOwnMessage && (
                                                            <p className="text-xs text-gray-400 mb-1">{message.sender.name}</p>
                                                        )}

                                                        {/* File message */}
                                                        {message.type === 'FILE' ? (
                                                            <div className="space-y-2">
                                                                {/* Image preview first if it's an image */}
                                                                {message.file?.mimeType?.startsWith('image/') && (
                                                                    <div className="relative">
                                                                        <img
                                                                            src={`http://localhost:5000/api/conversations/files/${message._id}`}
                                                                            alt=""
                                                                            className="max-w-sm rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                            onClick={() => handleDownloadFile(message._id, message.file?.originalName)}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* File info card */}
                                                                <div className={`flex items-center gap-3 rounded-xl p-3 ${isOwnMessage
                                                                    ? 'bg-white/10 backdrop-blur-sm'
                                                                    : 'bg-gray-800/50 backdrop-blur-sm'
                                                                    } border border-white/10 hover:border-white/20 transition-all group cursor-pointer`}
                                                                    onClick={() => handleDownloadFile(message._id, message.file?.originalName)}
                                                                >
                                                                    {getFileIcon(message.file?.mimeType)}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white text-sm font-medium truncate">
                                                                            {message.file?.originalName}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400">
                                                                            {formatFileSize(message.file?.size)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                                                                            {message.file?.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDownloadFile(message._id, message.file?.originalName);
                                                                            }}
                                                                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all group-hover:scale-110"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="w-4 h-4 text-blue-400" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-white break-words">{message.content}</p>
                                                        )}

                                                        <p className="text-xs text-gray-300 mt-2">
                                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>

                                                    {/* Unsend button for own messages */}
                                                    {isOwnMessage && canUnsendMessage(message) && (
                                                        <button
                                                            onClick={() => handleUnsendMessage(message._id)}
                                                            className="absolute -top-2 -right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            title="Unsend message"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t border-gray-700/40">
                            {/* File preview */}
                            {selectedFile && (
                                <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFileUpload}
                                        disabled={uploading}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                                    >
                                        {uploading ? 'Uploading...' : 'Send File'}
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                                />

                                {/* File attachment button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[#0B1220] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || !connected}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Send</span>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-20 h-20 text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                        <p className="text-gray-400">Choose a conversation from the sidebar to start chatting</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal - Will be implemented next */}
            {showNewChatModal && (
                <NewChatModal
                    onClose={() => setShowNewChatModal(false)}
                    onConversationCreated={(conversation) => {
                        setConversations(prev => [conversation, ...prev]);
                        setSelectedConversation(conversation);
                        setShowNewChatModal(false);
                    }}
                />
            )}
        </div>
    );
};
export default Chat;
