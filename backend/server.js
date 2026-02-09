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
import conversations from './routes/conversations.js';
import config from './routes/config.js';
import { initSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

// Enhanced CORS configuration for production
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
connectDB();
app.use('/auth', auth);
app.use('/workspaces', workspace);
app.use('/documents', documents);
app.use('/tasks', tasks);
app.use('/meetings', meetings);
app.use('/invitations', invitations);
app.use('/conversations', conversations);
app.use('/config', config);

app.get('/', (req, res) => {
  res.send("Server is running...");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
