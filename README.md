# CollabSuite - Remote Work Collaborative Suite

A production-ready, full-stack collaborative platform with real-time features including document editing, video conferencing, whiteboards, task management, and team chat.

## Features

### 🔐 Secure Authentication
- JWT-based authentication
- Persistent sessions
- Protected routes

### 📝 Real-Time Document Collaboration
- Rich text editor with Quill
- Live collaborative editing
- Auto-save functionality
- Socket.io synchronization

### 🎥 Video Conferencing
- WebRTC peer-to-peer connections
- Audio/video controls
- Screen sharing ready
- Meeting ID system

### 🎨 Collaborative Whiteboard
- Real-time drawing
- Multiple colors and brush sizes
- Eraser tool
- Download canvas

### ✅ Kanban Task Board
- Drag-and-drop task management
- Three columns: To Do, In Progress, Done
- Workspace-based organization
- Real-time updates

### 💬 Team Chat
- Real-time messaging
- Socket.io powered
- Message history
- User identification

## Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS 4** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time features
- **Quill** for rich text editing
- **dnd-kit** for drag-and-drop
- **simple-peer** for WebRTC

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```
PORT=3000
MONGO_URL=mongodb://localhost:27017/collabsuite
JWT_SECRET=your_super_secret_jwt_key_change_this
CLIENT_URL=http://localhost:5173
```

5. Start the server:
```bash
npm run nodemon
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env`:
```
VITE_API_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. **Register**: Create a new account from the landing page
2. **Create Workspace**: After login, create your first workspace
3. **Explore Features**:
   - **Documents**: Create and collaborate on documents in real-time
   - **Meetings**: Start or join video conferences
   - **Whiteboard**: Draw and brainstorm together
   - **Tasks**: Manage tasks with Kanban boards
   - **Chat**: Communicate with your team

## Project Structure

```
remote-work-colaborative-suite/
├── backend/
│   ├── controllers/        # Business logic
│   ├── Db/                 # Database connection
│   ├── middleware/         # Auth middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── socket.js           # Socket.io configuration
│   └── server.js           # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── auth/           # Auth components
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── layout/         # Layout components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── ui/             # UI components
│   │   └── App.jsx         # Main app component
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)

### Workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces` - Get all workspaces
- `GET /workspaces/:id` - Get single workspace
- `POST /workspaces/:id/members` - Add member

### Documents
- `POST /documents` - Create document
- `GET /documents/workspace/:workspaceId` - Get documents
- `GET /documents/:id` - Get single document
- `PUT /documents/:id` - Save document
- `DELETE /documents/:id` - Delete document

### Tasks
- `POST /tasks` - Create task
- `GET /tasks/workspace/:workspaceId` - Get tasks
- `PATCH /tasks/:id/status` - Update task status
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## Socket.io Events

### Document Collaboration
- `join-room` - Join document room
- `send-delta` - Send text changes
- `receive-delta` - Receive text changes

### Whiteboard
- `draw-line` - Send drawing data
- `receive-line` - Receive drawing data

### Video Conferencing
- `signal` - WebRTC signaling

### Chat
- `send-message` - Send chat message
- `receive-message` - Receive chat message

## Production Deployment

### Backend
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible
3. Use process manager like PM2
4. Enable HTTPS

### Frontend
1. Build the production bundle:
```bash
npm run build
```
2. Deploy the `dist` folder to your hosting platform
3. Update `VITE_API_URL` to your production backend URL

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for remote teams
