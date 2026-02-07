import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle2, RefreshCw, WifiOff, FileText } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import debounce from 'lodash/debounce';

// Register Quill Cursors only if not already registered
if (!Quill.imports['modules/cursors']) {
    Quill.register('modules/cursors', QuillCursors);
}

const DocumentEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [documentData, setDocumentData] = useState(null);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
    const [editorReady, setEditorReady] = useState(false);
    const [connected, setConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]); // Others in the room
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const quillRef = useRef(null);
    const cursorsRef = useRef(null);
    const isDirty = useRef(false); // Track if we have unsaved changes

    // Constant colors for cursors
    const cursorColors = ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

    // Debounced Auto-save
    const debouncedSave = useCallback(
        debounce(async (content) => {
            if (!id) return;
            try {
                await api.put(`/documents/${id}`, { content });
                setSaveStatus('saved');
                isDirty.current = false; // Mark as clean after save
            } catch (err) {
                console.error('Auto-save error:', err);
                setSaveStatus('error');
            }
        }, 2000),
        [id]
    );

    // Initialize Quill using a Callback Ref - The most robust way for React Strict Mode
    const wrapperRef = useCallback((wrapper) => {
        if (!wrapper) {
            // Cleanup: Save immediately using Fetch KeepAlive ONLY if dirty
            if (quillRef.current && isDirty.current) {
                const content = quillRef.current.root.innerHTML;
                const token = localStorage.getItem('token'); // Assuming standard token storage
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const url = `${apiUrl}/documents/${id}`;

                // Strategy 1: Fetch with KeepAlive (Primary)
                fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content }),
                    keepalive: true
                }).then(() => console.log('Exit save (wrapperRef) successful!'))
                    .catch(err => console.error('Exit save failed:', err));
            }

            quillRef.current = null;
            cursorsRef.current = null;
            return;
        }

        // 1. Clear any existing content (handles Strict Mode remounts)
        wrapper.innerHTML = '';

        // 2. Create a specific div for the editor itself
        const editorDiv = document.createElement('div');
        wrapper.appendChild(editorDiv);

        // 3. Initialize Quill
        const editor = new Quill(editorDiv, {
            theme: 'snow',
            placeholder: 'Start typing your document...',
            modules: {
                cursors: {
                    transformOnTextChange: true,
                },
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ color: [] }, { background: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean'],
                ],
            },
        });

        // 4. Store references
        quillRef.current = editor;

        // Note: In Quill 2.0, the cursors module registration might be different or deferred
        // Safe check before getting module
        if (editor.getModule('cursors')) {
            cursorsRef.current = editor.getModule('cursors');
        } else {
            // Fallback or retry if needed, but usually it registers sync
            console.warn('Cursors module not found immediately');
        }

        // 5. Setup Event Listeners

        // Selection Change (for cursors)
        editor.on('selection-change', (range) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('send-cursor', {
                    roomId: `doc_${id}`,
                    range,
                    userName: user?.name || 'Collaborator'
                });
            }
        });

        // Text Change (for deltas & auto-save)
        editor.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                setSaveStatus('saving');
                isDirty.current = true; // Mark as dirty
                debouncedSave(editor.root.innerHTML);

                if (socketRef.current?.connected) {
                    socketRef.current.emit('send-delta', {
                        roomId: `doc_${id}`,
                        delta
                    });
                }
            }
        });

        // 6. Signal readiness
        setEditorReady(true);

    }, [id, user?.name, debouncedSave]);

    // Initial content loading - runs when both data and editor are ready
    const contentLoaded = useRef(false);
    useEffect(() => {
        if (editorReady && quillRef.current && documentData && !contentLoaded.current) {
            if (documentData.content) {
                // Use dangerouslyPasteHTML for reliable HTML restoration in Quill 2.0
                quillRef.current.clipboard.dangerouslyPasteHTML(0, documentData.content);
                // Note: This triggers 'text-change' with source 'api', so it won't trigger auto-save.
            }
            contentLoaded.current = true;
            quillRef.current.focus();
        }
    }, [documentData, editorReady]);

    // Handle Browser Close / Refresh specifically using 'beforeunload'
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Only save if dirty
            if (quillRef.current && id && isDirty.current) {
                const content = quillRef.current.root.innerHTML;
                const token = localStorage.getItem('token');
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const url = `${apiUrl}/documents/${id}`;

                fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content }),
                    keepalive: true
                }).then(() => console.log('Exit save (beforeunload) successful!'))
                    .catch(err => console.error('Exit save failed during beforeunload:', err));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [id]);

    // Initialize Socket & Fetch Data
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const res = await api.get(`/documents/${id}`);
                if (isMounted) setDocumentData(res.data);
            } catch (err) {
                if (isMounted) setError(err.response?.data?.error || 'Failed to load document');
            }
        };

        const initSocket = () => {
            const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
            socketRef.current = socket;

            socket.on('connect', () => {
                if (isMounted) setConnected(true);
                socket.emit('join-room', `doc_${id}`, user?.name);
            });

            socket.on('receive-delta', (delta) => {
                if (quillRef.current) {
                    quillRef.current.updateContents(delta, 'silent');
                }
            });

            socket.on('receive-cursor', ({ range, userName, socketId }) => {
                const cursors = cursorsRef.current;
                if (cursors) {
                    const color = cursorColors[Math.abs(socketId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % cursorColors.length];
                    cursors.createCursor(socketId, userName, color);
                    cursors.moveCursor(socketId, range);
                }
            });

            socket.on('all-users', (users) => {
                if (isMounted) setActiveUsers(users);
            });

            socket.on('user-joined', (newUser) => {
                if (isMounted) setActiveUsers(prev => [...prev.filter(u => u.socketId !== newUser.socketId), newUser]);
            });

            socket.on('user-left', (socketId) => {
                if (isMounted) {
                    setActiveUsers(prev => prev.filter(u => u.socketId !== socketId));
                    cursorsRef.current?.removeCursor(socketId);
                }
            });

            socket.on('disconnect', () => {
                if (isMounted) setConnected(false);
            });
        };

        fetchData();
        initSocket();

        return () => {
            isMounted = false;
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, user?.name]);

    const handleManualSave = async () => {
        if (!quillRef.current) return;
        setSaveStatus('saving');
        try {
            await api.put(`/documents/${id}`, { content: quillRef.current.root.innerHTML });
            setSaveStatus('saved');
        } catch (err) {
            console.error('Save error:', err);
            setSaveStatus('error');
        }
    };

    const handleDownloadPDF = () => {
        if (!quillRef.current) return;
        const element = quillRef.current.root;
        const opt = {
            margin: 1,
            filename: `${documentData?.title || 'document'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        // Use html2pdf from global if imported via CDN or check import
        import('html2pdf.js').then(html2pdf => {
            html2pdf.default().set(opt).from(element).save();
        });
    };

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full text-white bg-[#0F172A]">
            <div className="p-8 bg-[#1E293B] rounded-2xl border border-red-500/20 text-center max-w-md shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WifiOff className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Connection Error</h2>
                <p className="text-slate-400 mb-6">{error}</p>
                <button onClick={() => navigate('/dashboard/documents')} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">Back to Documents</button>
            </div>
        </div>
    );

    if (!documentData) return (
        <div className="flex items-center justify-center h-full bg-[#0F172A]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <FileText className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#0B1222]">
            {/* Glossy Header */}
            <header className="flex items-center justify-between p-4 bg-[#111827]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard/documents')} className="p-2 hover:bg-white/5 rounded-xl transition-all group" title="Back">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-white tracking-tight">{documentData.title}</h1>
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`} />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center -space-x-2">
                                {activeUsers.map((u, i) => (
                                    <div key={u.socketId} className="w-6 h-6 rounded-full ring-2 ring-[#0B1222] bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold uppercase overflow-hidden transition-transform hover:scale-110 hover:z-10" title={u.name}>
                                        {u.name.charAt(0)}
                                    </div>
                                ))}
                                <div className="w-6 h-6 rounded-full ring-2 ring-[#0B1222] bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold uppercase transition-transform hover:scale-110 hover:z-10" title="You">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{activeUsers.length + 1} online</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/5">
                        {saveStatus === 'saving' ? (
                            <><RefreshCw className="w-3 h-3 text-blue-400 animate-spin" /><span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Syncing</span></>
                        ) : saveStatus === 'error' ? (
                            <><WifiOff className="w-3 h-3 text-rose-500" /><span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Save Error</span></>
                        ) : (
                            <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Saved</span></>
                        )}
                    </div>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <Save className="w-4 h-4 rotate-180" />
                        <span>Download PDF</span>
                    </button>
                </div>
            </header>

            {/* Editor Surface */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#0F172A] custom-scrollbar">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl min-h-[800px] mb-10 overflow-hidden relative">
                    <div ref={wrapperRef} className="quill-wrapper" />
                </div>
            </main>

            {/* Global Styles for Quill Overrides */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .quill-wrapper {
                    height: 100%;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }
                .ql-toolbar.ql-snow {
                    border: none !important;
                    background: #f8fafc !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 12px 24px !important;
                    width: 100% !important;
                    display: block !important;
                }
                .ql-container.ql-snow {
                    border: none !important;
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    font-family: inherit !important;
                }
                .ql-editor {
                    padding: 40px 60px !important;
                    font-size: 16px !important;
                    line-height: 1.6 !important;
                    color: #1e293b !important;
                    flex: 1 !important;
                    min-height: 700px !important;
                    outline: none !important;
                }
                .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                    left: 60px !important;
                    font-style: normal !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                /* Quill Cursors styling */
                .ql-cursor {
                    z-index: 100 !important;
                }
                .ql-cursor-selection {
                   opacity: 0.3 !important;
                }
                .ql-cursor-flag {
                    opacity: 1 !important;
                    border-radius: 2px !important;
                    padding: 2px 4px !important;
                    top: -20px !important;
                }
                .ql-cursor-name {
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    color: white !important;
                }
            ` }} />
        </div>
    );
};

export default DocumentEditor;
