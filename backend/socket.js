import { Server } from "socket.io";

let io;
// Global state for meetings
const meetingHosts = new Map();
const userInfo = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL,
                "http://localhost:5173",
                "http://localhost:5174"
            ].filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Track rooms user is in
        const userRooms = new Set();

        // Join a room (for documents, whiteboards, meetings)
        socket.on("join-room", (roomId, userName) => {
            try {
                // Validate inputs
                if (!roomId || typeof roomId !== 'string') {
                    console.error('Invalid roomId:', roomId);
                    return;
                }

                // Store user information
                if (userName && typeof userName === 'string') {
                    userInfo[socket.id] = userName.substring(0, 50); // Limit length
                }

                // Get all users currently in the room (excluding the new joiner)
                const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
                    .filter(id => id !== socket.id)
                    .map(id => ({
                        socketId: id,
                        name: userInfo[id] || 'Anonymous'
                    }));

                socket.join(roomId);
                userRooms.add(roomId);
                console.log(`Socket ${socket.id} (${userName || 'Anonymous'}) joined room ${roomId}`);

                // If this is a meeting room and no host exists, make this user the host
                if (roomId.startsWith('meet_') && !meetingHosts.has(roomId)) {
                    meetingHosts.set(roomId, socket.id);
                    socket.emit('you-are-host');
                    console.log(`👑 ${socket.id} (${userName || 'Anonymous'}) is now host of ${roomId}`);
                }

                // Tell existing users about the new joiner
                socket.to(roomId).emit("user-joined", {
                    socketId: socket.id,
                    name: userName || 'Anonymous'
                });

                // Tell the new joiner about all existing users
                socket.emit("all-users", usersInRoom);
            } catch (error) {
                console.error('Error in join-room:', error);
            }
        });

        // Signal routing (for WebRTC)
        socket.on("signal", ({ to, signal }) => {
            try {
                if (!to || !signal) {
                    console.error('Invalid signal data');
                    return;
                }
                io.to(to).emit("signal", {
                    signal,
                    from: socket.id,
                    name: userInfo[socket.id] || 'Anonymous'
                });
            } catch (error) {
                console.error('Error in signal:', error);
            }
        });

        // Chat messages (legacy - for meeting chat)
        socket.on("send-message", ({ roomId, message }) => {
            try {
                if (!roomId || !message) {
                    console.error('Invalid message data');
                    return;
                }
                socket.to(roomId).emit("receive-message", message);
            } catch (error) {
                console.error('Error in send-message:', error);
            }
        });

        // Join conversation room
        socket.on("join-conversation", (conversationId) => {
            try {
                if (!conversationId || typeof conversationId !== 'string') {
                    console.error('Invalid conversation ID');
                    return;
                }
                const roomId = `conversation_${conversationId}`;
                socket.join(roomId);
                userRooms.add(roomId);
                console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
            } catch (error) {
                console.error('Error in join-conversation:', error);
            }
        });

        // Leave conversation room
        socket.on("leave-conversation", (conversationId) => {
            try {
                if (!conversationId || typeof conversationId !== 'string') {
                    console.error('Invalid conversation ID');
                    return;
                }
                const roomId = `conversation_${conversationId}`;
                socket.leave(roomId);
                userRooms.delete(roomId);
                console.log(`Socket ${socket.id} left conversation ${conversationId}`);
            } catch (error) {
                console.error('Error in leave-conversation:', error);
            }
        });

        // Typing indicator for conversations
        socket.on("typing-start", ({ conversationId, userName }) => {
            try {
                if (!conversationId) {
                    console.error('Invalid typing data');
                    return;
                }
                socket.to(`conversation_${conversationId}`).emit("user-typing", {
                    socketId: socket.id,
                    userName: userName || userInfo[socket.id] || 'Anonymous'
                });
            } catch (error) {
                console.error('Error in typing-start:', error);
            }
        });

        socket.on("typing-stop", ({ conversationId }) => {
            try {
                if (!conversationId) {
                    console.error('Invalid typing data');
                    return;
                }
                socket.to(`conversation_${conversationId}`).emit("user-stopped-typing", {
                    socketId: socket.id
                });
            } catch (error) {
                console.error('Error in typing-stop:', error);
            }
        });

        // Task updates
        socket.on("task-update", ({ roomId, task }) => {
            socket.to(roomId).emit("task-updated", task);
        });

        // Document delta sync (Real-time collaborative editing)
        socket.on("send-delta", ({ roomId, delta }) => {
            try {
                if (!roomId || !delta) {
                    console.error('Invalid delta data');
                    return;
                }
                // Broadcast the delta to everyone else in the room (except sender)
                socket.to(roomId).emit("receive-delta", delta);
            } catch (error) {
                console.error('Error in send-delta:', error);
            }
        });

        // Cursor tracking
        socket.on("send-cursor", ({ roomId, range, userName }) => {
            try {
                if (!roomId) {
                    console.error('Invalid cursor data');
                    return;
                }
                // Broadcast cursor position and user name
                socket.to(roomId).emit("receive-cursor", {
                    range,
                    userName: userName || userInfo[socket.id] || 'Anonymous',
                    socketId: socket.id
                });
            } catch (error) {
                console.error('Error in send-cursor:', error);
            }
        });

        // Join document specific room (optional if different from generic join-room, but good for tracking docs)
        socket.on("join-document", (docId) => {
            const roomId = `doc_${docId}`;
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined document ${docId}`);
        });

        // Whiteboard sync
        socket.on("draw", ({ roomId, data }) => {
            try {
                if (!roomId || !data) {
                    console.error('Invalid draw data');
                    return;
                }
                socket.to(roomId).emit("draw-data", data);
            } catch (error) {
                console.error('Error in draw:', error);
            }
        });

        socket.on("draw-shape", ({ roomId, data }) => {
            try {
                if (!roomId || !data) {
                    console.error('Invalid shape data');
                    return;
                }
                socket.to(roomId).emit("shape-data", data);
            } catch (error) {
                console.error('Error in draw-shape:', error);
            }
        });

        socket.on("clear-canvas", (roomId) => {
            try {
                if (!roomId) {
                    console.error('Invalid clear-canvas data');
                    return;
                }
                socket.to(roomId).emit("canvas-cleared");
            } catch (error) {
                console.error('Error in clear-canvas:', error);
            }
        });

        // End meeting (host only)
        socket.on("end-meeting", (roomId) => {
            try {
                if (!roomId || typeof roomId !== 'string') {
                    console.error('Invalid end-meeting data');
                    return;
                }
                if (meetingHosts.get(roomId) === socket.id) {
                    console.log(`🛑 Host ${socket.id} ending meeting ${roomId}`);
                    socket.to(roomId).emit("meeting-ended");
                    meetingHosts.delete(roomId);
                }
            } catch (error) {
                console.error('Error in end-meeting:', error);
            }
        });

        // Leave room
        socket.on("leave-room", (roomId) => {
            try {
                if (!roomId || typeof roomId !== 'string') {
                    console.error('Invalid leave-room data');
                    return;
                }
                socket.leave(roomId);
                userRooms.delete(roomId);
                console.log(`Socket ${socket.id} left room ${roomId}`);
                socket.to(roomId).emit("user-left", socket.id);

                // If host left, assign new host or clean up
                if (meetingHosts.get(roomId) === socket.id) {
                    const remainingUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                    if (remainingUsers.length > 0) {
                        const newHost = remainingUsers[0];
                        meetingHosts.set(roomId, newHost);
                        io.to(newHost).emit('you-are-host');
                        console.log(`👑 ${newHost} is now host of ${roomId}`);
                    } else {
                        meetingHosts.delete(roomId);
                    }
                }
            } catch (error) {
                console.error('Error in leave-room:', error);
            }
        });

        socket.on("disconnect", () => {
            try {
                console.log("User disconnected:", socket.id);
                userRooms.forEach((roomId) => {
                    socket.to(roomId).emit("user-left", socket.id);

                    // Host cleanup on disconnect
                    if (meetingHosts.get(roomId) === socket.id) {
                        const remainingUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                        if (remainingUsers.length > 0) {
                            const newHost = remainingUsers[0];
                            meetingHosts.set(roomId, newHost);
                            io.to(newHost).emit('you-are-host');
                        } else {
                            meetingHosts.delete(roomId);
                        }
                    }
                });
                // Cleanup user info
                delete userInfo[socket.id];
                userRooms.clear();
            } catch (error) {
                console.error('Error in disconnect:', error);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.error("Socket.io not initialized!");
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
