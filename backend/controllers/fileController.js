import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { sendGroupInvitationEmail } from '../services/emailService.js';
import { getIO } from '../socket.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload file
export const uploadFile = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create file message
        const message = await Message.create({
            conversation: conversationId,
            sender: userId,
            content: req.file.originalname, // Store original filename as content
            type: 'FILE',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                url: req.file.path // Cloudinary URL from multer-storage-cloudinary
            }
        });

        // Update conversation's lastMessage
        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email');

        // Emit socket event
        try {
            const io = getIO();
            io.to(`conversation_${conversationId}`).emit('new-message', populatedMessage);
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Download file
export const downloadFile = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.type !== 'FILE') {
            return res.status(400).json({ error: 'Message is not a file' });
        }

        // Verify user has access to the conversation
        const conversation = await Conversation.findById(message.conversation);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Redirect to Cloudinary URL
        if (message.file && message.file.url) {
            return res.redirect(message.file.url);
        }

        // Fallback for older files (if any exist locally)
        const filePath = path.join(__dirname, '../uploads', message.file.filename);
        if (fs.existsSync(filePath)) {
            return res.download(filePath, message.file.originalName);
        }

        return res.status(404).json({ error: 'File not found' });
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
