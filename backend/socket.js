import { Server } from "socket.io";

let io;
// Global state for meetings
const meetingHosts = new Map();
const userInfo = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
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
            // Store user information
            if (userName) {
                userInfo[socket.id] = userName;
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
        });

        // Signal routing (for WebRTC)
        socket.on("signal", ({ to, signal }) => {
            io.to(to).emit("signal", {
                signal,
                from: socket.id,
                name: userInfo[socket.id] || 'Anonymous'
            });
        });

        // Chat messages
        socket.on("send-message", ({ roomId, message }) => {
            socket.to(roomId).emit("receive-message", message);
        });

        // Task updates
        socket.on("task-update", ({ roomId, task }) => {
            socket.to(roomId).emit("task-updated", task);
        });

        // Document sync
        socket.on("sync-document", ({ roomId, content }) => {
            socket.to(roomId).emit("receive-document", content);
        });

        // Whiteboard sync
        socket.on("draw", ({ roomId, data }) => {
            socket.to(roomId).emit("draw-data", data);
        });

        socket.on("clear-canvas", (roomId) => {
            socket.to(roomId).emit("canvas-cleared");
        });

        // End meeting (host only)
        socket.on("end-meeting", (roomId) => {
            if (meetingHosts.get(roomId) === socket.id) {
                console.log(`🛑 Host ${socket.id} ending meeting ${roomId}`);
                socket.to(roomId).emit("meeting-ended");
                meetingHosts.delete(roomId);
            }
        });

        // Leave room
        socket.on("leave-room", (roomId) => {
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
        });

        socket.on("disconnect", () => {
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
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
