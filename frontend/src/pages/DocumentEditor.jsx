import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Users } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import api from '../services/api';
import { io } from 'socket.io-client';

const DocumentEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const quillRef = useRef(null);

    useEffect(() => {
        fetchDocument();
        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [id]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/documents/${id}`);
            setDocument(response.data);
            setContent(response.data.content || '');
        } catch (error) {
            console.error('Fetch document error:', error);
        }
    };

    const initSocket = () => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-room', `doc_${id}`);
        });

        socket.on('receive-delta', (delta) => {
            if (quillRef.current) {
                const quill = quillRef.current.getEditor();
                quill.updateContents(delta);
            }
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });
    };

    const handleChange = (value, delta, source) => {
        setContent(value);
        if (source === 'user' && socketRef.current) {
            socketRef.current.emit('send-delta', { roomId: `doc_${id}`, delta });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/documents/${id}`, { content });
        } catch (error) {
            console.error('Save document error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!document) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/documents')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{document.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-gray-400'}`}>
                                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 bg-white rounded-xl overflow-hidden">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={content}
                    onChange={handleChange}
                    className="h-full"
                    modules={{
                        toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['blockquote', 'code-block'],
                            ['link'],
                            ['clean'],
                        ],
                    }}
                />
            </div>
        </div>
    );
};

export default DocumentEditor;
