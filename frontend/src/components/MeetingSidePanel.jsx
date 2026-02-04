import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const MeetingSidePanel = ({ socket, roomId, user, onClose, isOpen }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const chatEndRef = useRef(null);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [socket]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!currentMessage.trim() || !socket) return;

        const message = {
            text: currentMessage,
            sender: user?.name || 'Anonymous',
            timestamp: new Date().toISOString()
        };

        socket.emit('send-message', { roomId, message });
        setMessages(prev => [...prev, message]);
        setCurrentMessage('');
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-[#1a2332]/95 backdrop-blur-xl border-l border-gray-700/50 flex flex-col shadow-2xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Meeting Chat</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-sm text-gray-400">No messages yet</p>
                        <p className="text-xs text-gray-500 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === user?.name ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.sender === user?.name
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800/80 text-gray-100'
                                }`}>
                                {msg.sender !== user?.name && (
                                    <p className="text-xs font-medium text-blue-400 mb-1">{msg.sender}</p>
                                )}
                                <p className="text-sm break-words">{msg.text}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 px-2">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                        type="submit"
                        disabled={!currentMessage.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MeetingSidePanel;
