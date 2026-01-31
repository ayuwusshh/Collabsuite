import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Clock, User } from 'lucide-react';
import api from '../services/api';

const Documents = () => {
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspace');
    const [documents, setDocuments] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceId || '');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchDocuments();
        }
    }, [selectedWorkspace]);

    const fetchWorkspaces = async () => {
        try {
            const response = await api.get('/workspaces');
            setWorkspaces(response.data);
            if (!selectedWorkspace && response.data.length > 0) {
                setSelectedWorkspace(response.data[0]._id);
            }
        } catch (error) {
            console.error('Fetch workspaces error:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/documents/workspace/${selectedWorkspace}`);
            setDocuments(response.data);
        } catch (error) {
            console.error('Fetch documents error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDocument = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/documents', {
                title: newDocTitle,
                workspaceId: selectedWorkspace
            });
            setNewDocTitle('');
            setShowCreate(false);
            fetchDocuments();
        } catch (error) {
            console.error('Create document error:', error);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">Documents</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    disabled={!selectedWorkspace}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Document</span>
                </button>
            </div>

            {/* Workspace Selector */}
            {workspaces.length > 0 && (
                <select
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="w-full md:w-64 bg-[#1a2332]/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    {workspaces.map((ws) => (
                        <option key={ws._id} value={ws._id}>{ws.name}</option>
                    ))}
                </select>
            )}

            {/* Documents Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-[#1a2332]/30 border border-gray-700/40 rounded-xl p-10 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No documents yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc._id}
                            to={`/dashboard/document/${doc._id}`}
                            className="group bg-[#1a2332]/40 backdrop-blur-sm border border-gray-700/40 rounded-xl p-5 hover:border-blue-500/40 hover:bg-[#1a2332]/60 transition-all"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-blue-600/15 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                        {doc.title}
                                    </h3>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                </div>
                                {doc.lastEditedBy && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{doc.lastEditedBy.name}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Document Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a2332] border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Create New Document</h3>
                        <form onSubmit={handleCreateDocument}>
                            <input
                                type="text"
                                value={newDocTitle}
                                onChange={(e) => setNewDocTitle(e.target.value)}
                                placeholder="Document title"
                                required
                                className="w-full bg-[#0B1220] border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
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
        </div>
    );
};

export default Documents;
