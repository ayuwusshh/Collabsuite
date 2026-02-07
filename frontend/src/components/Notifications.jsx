import React, { useState, useEffect } from 'react';
import { Bell, Check, X, MessageCircle, Briefcase } from 'lucide-react';
import api from '../services/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const Notifications = ({ onUpdate }) => {
    const [workspaceInvitations, setWorkspaceInvitations] = useState([]);
    const [chatInvitations, setChatInvitations] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchInvitations();
            const cleanup = setupSocket();
            return cleanup;
        }
    }, [user]);

    const fetchInvitations = async () => {
        try {
            const [workspaceRes, chatRes] = await Promise.all([
                api.get('/invitations'),
                api.get('/conversations/pending-invitations')
            ]);
            setWorkspaceInvitations(workspaceRes.data);
            setChatInvitations(chatRes.data);
        } catch (error) {
            console.error('Fetch invitations error:', error);
        }
    };

    const setupSocket = () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const socket = io(API_URL);

        socket.on('connect', () => {
            socket.emit('join-room', `user_${user._id}`);
        });

        socket.on('workspace-invitation', (invitation) => {
            setWorkspaceInvitations(prev => [invitation, ...prev]);
            // Play notification sound
            new Audio('/notification.mp3').play().catch(e => console.log('Audio play failed', e));
        });

        socket.on('chat-invitation', (invitation) => {
            setChatInvitations(prev => [invitation, ...prev]);
            // Play notification sound
            new Audio('/notification.mp3').play().catch(e => console.log('Audio play failed', e));
        });

        return () => socket.disconnect();
    };

    const [processing, setProcessing] = useState(null); // Store ID of processing invitation

    const handleAccept = async (invitation) => {
        if (processing) return;
        setProcessing(invitation._id);

        try {
            if (invitation.type === 'CHAT_INVITATION') {
                // Accept chat invitation
                await api.post(`/conversations/${invitation.conversationId}/accept`);
                setChatInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                // Refresh conversations list
                window.dispatchEvent(new Event('conversation-updated'));
            } else {
                // Accept workspace invitation
                await api.post(`/invitations/${invitation._id}/accept`);
                setWorkspaceInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                window.dispatchEvent(new Event('workspace-updated'));
            }
            onUpdate && onUpdate();
        } catch (error) {
            console.error('Accept invitation error:', error);
            if (error.response?.data?.error !== "Invitation already processed") {
                alert('Failed to accept invitation');
            } else {
                // Remove from list even if already processed
                if (invitation.type === 'CHAT_INVITATION') {
                    setChatInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                } else {
                    setWorkspaceInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                }
            }
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (invitation) => {
        if (processing) return;
        setProcessing(invitation._id);

        try {
            if (invitation.type === 'CHAT_INVITATION') {
                // For chat invitations, we don't have a reject endpoint yet
                // Just remove from local state
                setChatInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
            } else {
                await api.post(`/invitations/${invitation._id}/reject`);
                setWorkspaceInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
            }
        } catch (error) {
            console.error('Reject invitation error:', error);
            if (error.response?.data?.error !== "Invitation already processed") {
                alert('Failed to reject invitation');
            } else {
                if (invitation.type === 'CHAT_INVITATION') {
                    setChatInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                } else {
                    setWorkspaceInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
                }
            }
        } finally {
            setProcessing(null);
        }
    };

    const allInvitations = [
        ...chatInvitations.map(inv => ({ ...inv, type: 'CHAT_INVITATION' })),
        ...workspaceInvitations
    ].sort((a, b) => new Date(b.invitedAt || b.createdAt) - new Date(a.invitedAt || a.createdAt));

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {allInvitations.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B1220]"></span>
                )}
            </button>

            {showDropdown && (
                <div className="fixed top-16 left-4 right-4 w-auto md:absolute md:top-full md:right-0 md:left-auto md:w-80 md:mt-2 bg-[#1a2332] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[100]">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {allInvitations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            allInvitations.map((invitation) => (
                                <div key={invitation._id} className="p-3 border-b border-gray-700/50 hover:bg-[#1f293a] transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${invitation.type === 'CHAT_INVITATION' ? 'bg-purple-600/20' : 'bg-blue-600/20'}`}>
                                            {invitation.type === 'CHAT_INVITATION' ? (
                                                <MessageCircle className="w-4 h-4 text-purple-400" />
                                            ) : (
                                                <Briefcase className="w-4 h-4 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-300">
                                                <span className="font-semibold text-white">{invitation.invitedBy.name}</span> invited you to join{' '}
                                                <span className={`font-semibold ${invitation.type === 'CHAT_INVITATION' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                    {invitation.type === 'CHAT_INVITATION' ? invitation.conversationName : invitation.workspace.name}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(invitation.invitedAt || invitation.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleAccept(invitation)}
                                            disabled={!!processing}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {processing === invitation._id ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                                        </button>
                                        <button
                                            onClick={() => handleReject(invitation)}
                                            disabled={!!processing}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#253045] hover:bg-[#2d3a52] text-gray-300 rounded-lg text-xs font-medium transition-colors ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <X className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </div>
    );
};

export default Notifications;
