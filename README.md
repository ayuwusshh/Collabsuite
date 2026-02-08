# 🚀 CollabSuite - Remote Work Collaboration Platform

<div align="center">

![CollabSuite Banner](https://img.shields.io/badge/CollabSuite-v1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/react-19.1.1-61DAFB?style=for-the-badge&logo=react)

**A production-ready, full-stack real-time collaboration platform designed for modern remote teams**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

CollabSuite is an all-in-one remote work collaboration platform that brings together the essential tools teams need to work effectively from anywhere. Built with modern web technologies and real-time capabilities, it provides seamless document collaboration, video conferencing, interactive whiteboards, task management, and team communication.

### ✨ Why CollabSuite?

- **🔄 Real-Time Synchronization**: Experience instant updates across all features using Socket.io
- **🎯 All-in-One Solution**: No need to juggle multiple tools - everything you need in one place
- **🔐 Secure & Reliable**: JWT-based authentication with bcrypt password hashing
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **🎨 Modern UI/UX**: Built with Tailwind CSS 4 for a beautiful, intuitive interface

---

## 🎯 Features

### 🔐 **Authentication & Security**
- JWT-based authentication with secure token management
- Bcrypt password hashing for enhanced security
- Persistent user sessions
- Protected routes and middleware
- Email validation and secure registration flow

### 📝 **Real-Time Document Collaboration**
- Rich text editing powered by Quill 2.0
- Live collaborative editing with cursor tracking
- Auto-save functionality with visual feedback
- PDF export capability (download documents as PDF)
- Real-time synchronization via Socket.io
- Document versioning and history
- Workspace-based document organization

### 💬 **Advanced Team Chat**
- Real-time messaging with Socket.io
- Direct messages and group conversations
- File sharing (images, documents, PDFs, spreadsheets, archives)
- Message file attachments with preview
- **Unsend messages** within 15 minutes
- **Delete conversations** from your view without affecting others
- Online status indicators
- Conversation search functionality
- Responsive chat interface optimized for all screen sizes
- Image preview and download
- File type indicators and size display

### 🎥 **Video Conferencing**
- WebRTC-based peer-to-peer video calls
- High-quality audio/video streaming
- Toggle camera and microphone controls
- Screen sharing capabilities
- Participant name display
- Camera auto-off when leaving meetings
- Meeting room system with unique IDs
- Private and public meeting options
- Real-time participant management

### 🎨 **Collaborative Whiteboard**
- Real-time collaborative drawing
- Multiple drawing tools and colors
- Adjustable brush sizes
- Eraser functionality
- Canvas download feature
- Instant synchronization across all participants
- Smooth drawing experience with optimized rendering

### ✅ **Kanban Task Board**
- Interactive drag-and-drop task management powered by dnd-kit
- Three-column workflow: To Do, In Progress, Done
- Task creation, editing, and deletion
- Task status updates with real-time sync
- Priority levels and due dates
- Workspace-based task organization
- Persistent task state

### 🏢 **Workspace Management**
- Create and manage multiple workspaces
- Invite team members via email
- Role-based access control
- Workspace-specific resources (documents, tasks, etc.)
- Member management and permissions

---

## 🛠 Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.1 | UI framework with latest features |
| **Vite** | 7.1.7 | Ultra-fast build tool and dev server |
| **Tailwind CSS** | 4.1.13 | Utility-first styling framework |
| **React Router** | 7.9.3 | Client-side routing |
| **Axios** | 1.7.9 | HTTP client for API calls |
| **Socket.io Client** | 4.8.1 | Real-time bidirectional communication |
| **Quill** | 2.0.3 | Rich text editor |
| **dnd-kit** | 6.3.1 | Drag-and-drop functionality |
| **simple-peer** | 9.11.1 | WebRTC peer connections |
| **Lucide React** | 0.544.0 | Beautiful icon library |
| **html2pdf.js** | 0.14.0 | PDF generation |

### **Backend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | ≥18.0.0 | JavaScript runtime |
| **Express** | 5.1.0 | Web application framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 8.18.1 | MongoDB object modeling |
| **Socket.io** | 4.8.1 | Real-time engine |
| **JWT** | 9.0.2 | Token-based authentication |
| **Bcrypt** | 6.0.0 | Password hashing |
| **Multer** | 2.0.2 | File upload handling |
| **Nodemailer** | 7.0.13 | Email notifications |
| **CORS** | 2.8.5 | Cross-origin resource sharing |

---

## 🚀 Getting Started

### **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas account) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** for version control

### **Installation**

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ayuwusshh/remote-work-colaborative-suite.git
cd remote-work-colaborative-suite
```

#### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure `.env` file:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URL=mongodb://localhost:27017/collabsuite
# For MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/collabsuite

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS
CLIENT_URL=http://localhost:5173

# Email (Optional - for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Start the backend server:**

```bash
# Development mode with auto-reload
npm run nodemon

# Or production mode
npm start
```

✅ Backend will run on `http://localhost:3000`

#### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd ../frontend

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
cp .env.example .env
```

**Configure `.env` file:**

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

**Start the development server:**

```bash
npm run dev
```

✅ Frontend will run on `http://localhost:5173`

### **Quick Start Guide**

1. **Register Account**: Navigate to `http://localhost:5173` and click "Get Started"
2. **Create Workspace**: After login, create your first workspace
3. **Invite Team Members**: Add team members via email invitations
4. **Explore Features**:
   - 📝 **Documents**: Create and collaborate on documents in real-time
   - 🎥 **Meetings**: Start or join video conferences
   - 🎨 **Whiteboard**: Draw and brainstorm together
   - ✅ **Tasks**: Organize work with Kanban boards
   - 💬 **Chat**: Communicate instantly with your team

---

## 📁 Project Structure

```
remote-work-colaborative-suite/
│
├── backend/                      # Node.js/Express backend
│   ├── controllers/              # Request handlers & business logic
│   │   ├── adminController.js    # Admin-related operations
│   │   ├── authController.js     # Authentication logic
│   │   ├── conversationController.js  # Chat functionality
│   │   ├── documentController.js # Document management
│   │   ├── taskController.js     # Task management
│   │   └── workspaceController.js # Workspace operations
│   │
│   ├── Db/                       # Database configuration
│   │   └── connect.js            # MongoDB connection
│   │
│   ├── middleware/               # Express middlewares
│   │   ├── auth.js               # JWT authentication
│   │   └── upload.js             # File upload handling
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── Conversation.js       # Chat conversations
│   │   ├── Document.js           # Documents
│   │   ├── Message.js            # Chat messages
│   │   ├── Task.js               # Tasks
│   │   ├── User.js               # Users
│   │   └── Workspace.js          # Workspaces
│   │
│   ├── routes/                   # API route definitions
│   │   ├── auth.js               # Auth routes
│   │   ├── conversations.js      # Chat routes
│   │   ├── documents.js          # Document routes
│   │   ├── tasks.js              # Task routes
│   │   └── workspaces.js         # Workspace routes
│   │
│   ├── uploads/                  # Uploaded files storage
│   ├── socket.js                 # Socket.io event handlers
│   ├── server.js                 # Application entry point
│   ├── package.json              # Dependencies & scripts
│   └── .env                      # Environment variables
│
├── frontend/                     # React/Vite frontend
│   ├── src/
│   │   ├── auth/                 # Authentication components
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── components/           # Reusable UI components
│   │   │   ├── NewChatModal.jsx
│   │   │   ├── Notifications.jsx
│   │   │   └── TaskCard.jsx
│   │   │
│   │   ├── context/              # React Context providers
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   └── DashboardLayout.jsx
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── Chat.jsx          # Team chat interface
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── DocumentEditor.jsx # Document editor
│   │   │   ├── Documents.jsx     # Documents list
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Tasks.jsx         # Kanban board
│   │   │   ├── VideoMeet.jsx     # Video conferencing
│   │   │   └── Whiteboard.jsx    # Collaborative whiteboard
│   │   │
│   │   ├── services/             # API services
│   │   │   └── api.js            # Axios configuration
│   │   │
│   │   ├── ui/                   # UI components (Navbar, etc.)
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # Application entry point
│   │   └── index.css             # Global styles
│   │
│   ├── public/                   # Static assets
│   ├── package.json              # Dependencies & scripts
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   └── .env                      # Environment variables
│
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

---

## 📚 API Documentation

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/me` | Get current user | ✅ |

### **Workspace Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/workspaces` | Create workspace | ✅ |
| GET | `/workspaces` | Get all user workspaces | ✅ |
| GET | `/workspaces/:id` | Get single workspace | ✅ |
| POST | `/workspaces/:id/members` | Add workspace member | ✅ |
| DELETE | `/workspaces/:id/members/:userId` | Remove member | ✅ |

### **Document Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/documents` | Create document | ✅ |
| GET | `/documents/workspace/:workspaceId` | Get workspace documents | ✅ |
| GET | `/documents/:id` | Get single document | ✅ |
| PUT | `/documents/:id` | Update document content | ✅ |
| DELETE | `/documents/:id` | Delete document | ✅ |

### **Task Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tasks` | Create task | ✅ |
| GET | `/tasks/workspace/:workspaceId` | Get workspace tasks | ✅ |
| GET | `/tasks/:id` | Get single task | ✅ |
| PUT | `/tasks/:id` | Update task | ✅ |
| PATCH | `/tasks/:id/status` | Update task status | ✅ |
| DELETE | `/tasks/:id` | Delete task | ✅ |

### **Conversation Endpoints (Chat)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/conversations` | Create conversation | ✅ |
| GET | `/conversations` | Get user conversations | ✅ |
| GET | `/conversations/:id/messages` | Get conversation messages | ✅ |
| POST | `/conversations/messages` | Send message | ✅ |
| POST | `/conversations/:id/upload` | Upload file to conversation | ✅ |
| GET | `/conversations/files/:messageId` | Download file | ✅ |
| DELETE | `/conversations/:id/messages/:messageId` | Unsend message | ✅ |
| DELETE | `/conversations/:id/hide` | Hide conversation | ✅ |
| POST | `/conversations/:id/leave` | Leave group | ✅ |
| DELETE | `/conversations/:id` | Delete group (admin) | ✅ |

---

## 🔌 Socket.io Events

### **Document Collaboration**
```javascript
// Client → Server
socket.emit('join-room', documentId)
socket.emit('send-delta', { delta, documentId })
socket.emit('leave-room', documentId)

// Server → Client
socket.on('receive-delta', ({ delta, userId }) => {})
socket.on('user-connected', userId => {})
socket.on('user-disconnected', userId => {})
```

### **Whiteboard**
```javascript
// Client → Server
socket.emit('join-whiteboard', roomId)
socket.emit('draw-line', { from, to, color, width })

// Server → Client
socket.on('receive-line', ({ from, to, color, width }) => {})
```

### **Video Conferencing**
```javascript
// Client → Server
socket.emit('join-meeting', { meetingId, userName })
socket.emit('signal', { to, from, signal })
socket.emit('leave-meeting', meetingId)

// Server → Client
socket.on('user-joined', ({ userId, userName }) => {})
socket.on('signal', ({ from, signal }) => {})
socket.on('user-left', userId => {})
```

### **Chat**
```javascript
// Client → Server
socket.emit('join-conversation', conversationId)
socket.emit('send-message', { conversationId, content })
socket.emit('leave-conversation', conversationId)

// Server → Client
socket.on('new-message', message => {})
socket.on('message-deleted', ({ conversationId, messageId }) => {})
socket.on('conversation-created', conversation => {})
socket.on('user-joined-conversation', ({ conversationId, user }) => {})
```

---

## 🚢 Production Deployment

### **Backend Deployment**

1. **Environment Setup**
   - Set all environment variables on your hosting platform
   - Use a production MongoDB instance (MongoDB Atlas recommended)
   - Generate a strong JWT secret

2. **Process Management**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start with PM2
   pm2 start server.js --name collabsuite-backend
   
   # Enable auto-restart on reboot
   pm2 startup
   pm2 save
   ```

3. **Security Checklist**
   - ✅ Enable HTTPS/SSL
   - ✅ Set up rate limiting
   - ✅ Configure CORS properly
   - ✅ Use environment variables for secrets
   - ✅ Enable MongoDB authentication

### **Frontend Deployment**

1. **Build Production Bundle**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy Options**
   - **Vercel**: `vercel deploy`
   - **Netlify**: Upload `dist` folder
   - **AWS S3 + CloudFront**: Static hosting
   - **Nginx**: Serve `dist` folder

3. **Environment Configuration**
   - Update `VITE_API_URL` to production backend URL
   - Ensure all API endpoints use HTTPS

---

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### **Contribution Guidelines**
- Follow existing code style and conventions
- Write meaningful commit messages
- Update documentation for new features
- Add tests for new functionality
- Ensure all tests pass before submitting PR

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately

---

## 🙏 Acknowledgments

- **React Team** for the amazing UI library
- **Socket.io** for real-time communication
- **MongoDB** for flexible database solution
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for beautiful icons
- All open-source contributors whose work made this project possible

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/ayuwusshh/remote-work-colaborative-suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ayuwusshh/remote-work-colaborative-suite/discussions)
- **Email**: collabsuite01@gmail.com

---

## 🗺 Roadmap

### **Upcoming Features**
- [ ] Mobile applications (React Native)
- [ ] End-to-end encryption for messages
- [ ] Advanced task analytics and reporting
- [ ] Calendar integration
- [ ] Third-party integrations (Slack, Google Drive, etc.)
- [ ] Advanced whiteboard tools (shapes, text, etc.)
- [ ] Meeting recording functionality
- [ ] AI-powered features (summarization, transcription)

---

<div align="center">

**Built with ❤️ for remote teams worldwide**

⭐ **Star this repository if you find it helpful!** ⭐

</div>
