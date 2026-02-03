import { Server } from "socket.io";

let io;
// Track meeting hosts { roomId: socketId }
const meetingHosts = new Map();

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
        socket.on("join-room", (roomId) => {
            // Get all users currently in the room (excluding the new joiner)
            const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
                .filter(id => id !== socket.id);

            socket.join(roomId);
            userRooms.add(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
            console.log(`Existing users in room:`, usersInRoom);

            // If this is a meeting room and no host exists, make this user the host
            if (roomId.startsWith('meet_') && !meetingHosts.has(roomId)) {
                meetingHosts.set(roomId, socket.id);
                socket.emit('you-are-host');
                console.log(`👑 ${socket.id} is now host of ${roomId}`);
            }

            // Tell existing users about the new joiner
            socket.to(roomId).emit("user-joined", socket.id);

            // Tell the new joiner about all existing users
            socket.emit("all-users", usersInRoom);
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

        // Document collaboration - send text deltas
        socket.on("send-delta", ({ roomId, delta }) => {
            socket.to(roomId).emit("receive-delta", delta);
        });

        // Whiteboard - broadcast drawing data
        socket.on("draw-line", ({ roomId, lineData }) => {
            socket.to(roomId).emit("receive-line", lineData);
        });

        // Video conferencing - WebRTC signaling
        socket.on("signal", ({ to, signal }) => {
            console.log(`📡 Signal from ${socket.id} to ${to}`);
            io.to(to).emit("signal", { signal, from: socket.id });
        });

        // Chat messages
        socket.on("send-message", ({ roomId, message }) => {
            socket.to(roomId).emit("receive-message", message);
        });

        // Task updates
        socket.on("task-update", ({ roomId, task }) => {
            socket.to(roomId).emit("task-updated", task);
        });

        socket.on("disconnecting", () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit("user-left", socket.id);

                    // Handle host leaving via disconnect
                    if (meetingHosts.get(room) === socket.id) {
                        const remainingUsers = Array.from(io.sockets.adapter.rooms.get(room) || [])
                            .filter(id => id !== socket.id);
                        if (remainingUsers.length > 0) {
                            const newHost = remainingUsers[0];
                            meetingHosts.set(room, newHost);
                            io.to(newHost).emit('you-are-host');
                            console.log(`👑 ${newHost} is now host of ${room}`);
                        } else {
                            meetingHosts.delete(room);
                        }
                    }
                }
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
