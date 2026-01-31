import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const roomId = 'chat_main'; // In production, this would be workspace-specific

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-room', roomId);
        });

        socket.on('receive-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current) {
            const message = {
                id: Date.now(),
                text: newMessage,
                sender: user?.name || 'Anonymous',
                timestamp: new Date().toISOString(),
                userId: user?._id
            };

            socketRef.current.emit('send-message', { roomId, message });
            setMessages(prev => [...prev, message]);
            setNewMessage('');
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Team Chat</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-400">
                            {connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 bg-[#1a2332]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => {
                            const isOwnMessage = message.userId === user?._id;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] ${isOwnMessage
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                                : 'bg-[#0B1220]'
                                            } rounded-lg p-4`}
                                    >
                                        {!isOwnMessage && (
                                            <p className="text-xs text-gray-400 mb-1">{message.sender}</p>
                                        )}
                                        <p className="text-white break-words">{message.text}</p>
                                        <p className="text-xs text-gray-300 mt-2">
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#1a2332] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || !connected}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                >
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
};

export default Chat;
