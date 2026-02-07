import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, Layout, CheckSquare, Plus, Clock, UserPlus, Trash2, LogOut } from 'lucide-react';
import api from '../services/api';
import AddMemberModal from '../components/AddMemberModal';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Dashboard = () => {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [selectedWorkspaceForMember, setSelectedWorkspaceForMember] = useState(null);

    useEffect(() => {
        if (user) {
            fetchWorkspaces();
        }

        const handleWorkspaceUpdate = () => fetchWorkspaces();
        window.addEventListener('workspace-updated', handleWorkspaceUpdate);

        let socket;
        if (user) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            socket = io(API_URL);

            socket.on('connect', () => {
                socket.emit('join-room', `user_${user._id}`);
            });

            socket.on('workspace-deleted', (workspaceId) => {
                setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
            });
        }

        return () => {
            window.removeEventListener('workspace-updated', handleWorkspaceUpdate);
            if (socket) socket.disconnect();
        };
    }, [user]);

    const fetchWorkspaces = async () => {
        try {
            const response = await api.get('/workspaces');
            setWorkspaces(response.data);
        } catch (error) {
            console.error('Fetch workspaces error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        try {
            await api.post('/workspaces', { name: workspaceName });
            setWorkspaceName('');
            setShowCreateWorkspace(false);
            fetchWorkspaces();
        } catch (error) {
            console.error('Create workspace error:', error);
            alert('Failed to create workspace. Please try again.');
        }
    };

    const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
        if (!window.confirm(`Are you sure you want to delete "${workspaceName}"? This will delete all tasks and documents in this workspace.`)) {
            return;
        }

        // Optimistic update
        setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));

        try {
            await api.delete(`/workspaces/${workspaceId}`);
            // No need to fetchWorkspaces() if successful, as it's already removed locally
        } catch (error) {
            console.error('Delete workspace error:', error);
            const errorMsg = error.response?.data?.error || 'Failed to delete workspace';
            alert(errorMsg);
            fetchWorkspaces(); // Revert/fetch on error
        }
    };

    const handleLeaveWorkspace = async (workspaceId, workspaceName) => {
        if (!window.confirm(`Are you sure you want to leave "${workspaceName}"?`)) {
            return;
        }

        // Optimistic update
        setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));

        try {
            await api.post(`/workspaces/${workspaceId}/leave`);
            // No need to fetchWorkspaces() if successful
        } catch (error) {
            console.error('Leave workspace error:', error);
            const errorMsg = error.response?.data?.error || 'Failed to leave workspace';
            alert(errorMsg);
            fetchWorkspaces(); // Revert/fetch on error
        }
    };

    const quickActions = [
        { icon: FileText, label: 'New Document', path: '/dashboard/documents', color: 'from-blue-500/20 to-cyan-500/20' },
        { icon: Video, label: 'Meeting', path: '/dashboard/meetings', color: 'from-purple-500/20 to-pink-500/20' },
        { icon: Layout, label: 'Whiteboard', path: '/dashboard/whiteboard', color: 'from-green-500/20 to-emerald-500/20' },
        { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks', color: 'from-orange-500/20 to-red-500/20' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-white mb-1.5">Dashboard</h1>
                <p className="text-sm text-gray-400">Manage your workspaces and collaborate with your team</p>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-base font-medium text-gray-300 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.path}
                            to={action.path}
                            className="group relative overflow-hidden bg-[#1a2332]/40 backdrop-blur-sm border border-gray-700/40 rounded-xl p-5 hover:border-gray-600/60 transition-all duration-200 hover:bg-[#1a2332]/60"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
                            <action.icon className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors mb-2.5 relative z-10" />
                            <h3 className="text-white text-sm font-medium relative z-10">{action.label}</h3>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Workspaces */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-medium text-gray-300">Your Workspaces</h2>
                    <button
                        onClick={() => setShowCreateWorkspace(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Workspace</span>
                    </button>
                </div>

                {workspaces.length === 0 ? (
                    <div className="bg-[#1a2332]/30 border border-gray-700/40 rounded-xl p-10 text-center">
                        <p className="text-gray-400 text-sm mb-3">No workspaces yet. Create one to get started!</p>
                        <button
                            onClick={() => setShowCreateWorkspace(true)}
                            className="px-5 py-2 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
                        >
                            Create Your First Workspace
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workspaces.map((workspace) => (
                            <div
                                key={workspace._id}
                                className="bg-[#1a2332]/40 backdrop-blur-sm border border-gray-700/40 rounded-xl p-5 hover:border-gray-600/60 hover:bg-[#1a2332]/60 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-base font-medium text-white">{workspace.name}</h3>
                                        {workspace.userRole && (
                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                                {workspace.userRole}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedWorkspaceForMember(workspace)}
                                            className="text-gray-400 hover:text-blue-400 transition-colors"
                                            title="Add member"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                        {workspace.userRole === 'owner' ? (
                                            <button
                                                onClick={() => handleDeleteWorkspace(workspace._id, workspace.name)}
                                                className="text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete workspace"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleLeaveWorkspace(workspace._id, workspace.name)}
                                                className="text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Leave workspace"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/dashboard/documents?workspace=${workspace._id}`}
                                        className="flex-1 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 rounded-lg text-xs text-center transition-colors"
                                    >
                                        Documents
                                    </Link>
                                    <Link
                                        to={`/dashboard/tasks?workspace=${workspace._id}`}
                                        className="flex-1 px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 rounded-lg text-xs text-center transition-colors"
                                    >
                                        Tasks
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Workspace Modal */}
            {showCreateWorkspace && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a2332] border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Create New Workspace</h3>
                        <form onSubmit={handleCreateWorkspace}>
                            <input
                                type="text"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder="Workspace name"
                                required
                                className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateWorkspace(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {selectedWorkspaceForMember && (
                <AddMemberModal
                    workspace={selectedWorkspaceForMember}
                    onClose={() => setSelectedWorkspaceForMember(null)}
                    onMemberAdded={() => {
                        fetchWorkspaces();
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
