import { Server } from "socket.io";

let io;

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
            socket.join(roomId);
            userRooms.add(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
            socket.to(roomId).emit("user-joined", socket.id);
        });

        // Leave room
        socket.on("leave-room", (roomId) => {
            socket.leave(roomId);
            userRooms.delete(roomId);
            console.log(`Socket ${socket.id} left room ${roomId}`);
            socket.to(roomId).emit("user-left", socket.id);
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
