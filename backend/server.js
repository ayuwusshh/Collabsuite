//server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './Db/index.js';
import auth from './routes/auth.js';
import workspace from './routes/workspace.js';
import documents from './routes/documents.js';
import tasks from './routes/tasks.js';
import meetings from './routes/meetings.js';
import invitations from './routes/invitation.js';
import { initSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/auth', auth);
app.use('/workspaces', workspace);
app.use('/documents', documents);
app.use('/tasks', tasks);
app.use('/meetings', meetings);
app.use('/invitations', invitations);

app.get('/', (req, res) => {
  res.send("Server is running...");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


const Port = process.env.PORT || 3000;
httpServer.listen(Port, () => {
  console.log(`Server is running on Port ${Port}`);
});
