import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import api from '../services/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const Notifications = ({ onUpdate }) => {
    const [invitations, setInvitations] = useState([]);
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
            const response = await api.get('/invitations');
            setInvitations(response.data);
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
            setInvitations(prev => [invitation, ...prev]);
            // Play notification sound
            new Audio('/notification.mp3').play().catch(e => console.log('Audio play failed', e));
        });

        return () => socket.disconnect();
    };

    const [processing, setProcessing] = useState(null); // Store ID of processing invitation

    const handleAccept = async (invitationId) => {
        if (processing) return;
        setProcessing(invitationId);
        try {
            await api.post(`/invitations/${invitationId}/accept`);
            setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
            window.dispatchEvent(new Event('workspace-updated'));
            onUpdate && onUpdate();
        } catch (error) {
            console.error('Accept invitation error:', error);
            // Don't alert if it's already accepted (race condition handling)
            if (error.response?.data?.error !== "Invitation already processed") {
                alert('Failed to accept invitation');
            } else {
                // Even if it failed as "already processed", remove it from list
                setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
                window.dispatchEvent(new Event('workspace-updated'));
            }
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (invitationId) => {
        if (processing) return;
        setProcessing(invitationId);
        try {
            await api.post(`/invitations/${invitationId}/reject`);
            setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        } catch (error) {
            console.error('Reject invitation error:', error);
            if (error.response?.data?.error !== "Invitation already processed") {
                alert('Failed to reject invitation');
            } else {
                setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
            }
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {invitations.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B1220]"></span>
                )}
            </button>

            {showDropdown && (
                <div className="fixed top-16 left-4 right-4 w-auto md:absolute md:top-full md:right-0 md:left-auto md:w-80 md:mt-2 bg-[#1a2332] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[100]">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {invitations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            invitations.map((invitation) => (
                                <div key={invitation._id} className="p-3 border-b border-gray-700/50 hover:bg-[#1f293a] transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-300">
                                                <span className="font-semibold text-white">{invitation.invitedBy.name}</span> invited you to join <span className="font-semibold text-blue-400">{invitation.workspace.name}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(invitation.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleAccept(invitation._id)}
                                            disabled={!!processing}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {processing === invitation._id ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                                        </button>
                                        <button
                                            onClick={() => handleReject(invitation._id)}
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
