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

// Create a new conversation (DM or Group)
export const createConversation = async (req, res) => {
    try {
        const { type, participants, name, workspaceId } = req.body;
        const userId = req.user._id;

        // Validation
        if (!type || !['DIRECT', 'GROUP', 'WORKSPACE'].includes(type)) {
            return res.status(400).json({ error: 'Invalid conversation type' });
        }

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ error: 'Participants are required' });
        }

        // Ensure current user is in participants
        const allParticipants = [...new Set([userId.toString(), ...participants])];

        // Validate WORKSPACE type
        if (type === 'WORKSPACE') {
            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID required for workspace channels' });
            }

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            // Verify user has access to workspace
            const hasAccess = workspace.users.some(u => u.user && u.user.toString() === userId.toString());
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied to workspace' });
            }
        }

        // Validate DIRECT type
        if (type === 'DIRECT') {
            if (allParticipants.length !== 2) {
                return res.status(400).json({ error: 'Direct messages must have exactly 2 participants' });
            }

            // Check if DM already exists
            const existingDM = await Conversation.findOne({
                type: 'DIRECT',
                participants: { $all: allParticipants, $size: 2 }
            });

            if (existingDM) {
                return res.status(200).json(existingDM);
            }
        }

        // Validate all participants exist
        const validUsers = await User.find({ _id: { $in: allParticipants } });
        if (validUsers.length !== allParticipants.length) {
            return res.status(400).json({ error: 'One or more participants not found' });
        }

        // Create conversation
        const conversationData = {
            type,
            participants: allParticipants,
            admins: [userId]
        };

        if (name && (type === 'GROUP' || type === 'WORKSPACE')) {
            conversationData.name = name.trim().substring(0, 100);
        }

        if (type === 'WORKSPACE') {
            conversationData.workspace = workspaceId;
        }

        const conversation = await Conversation.create(conversationData);
        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name email')
            .populate('admins', 'name email');

        // Emit socket event to all participants
        try {
            const io = getIO();
            allParticipants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('conversation-created', populatedConversation);
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(201).json(populatedConversation);
    } catch (error) {
        console.error('Create conversation error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
            hiddenBy: { $ne: userId } // Exclude conversations hidden by this user
        })
            .populate('participants', 'name email')
            .populate('lastMessage')
            .populate('admins', 'name email')
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const { limit = 50, before } = req.query;

        // Verify user is participant
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

        // Build query
        const query = { conversation: conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json(messages.reverse());
    } catch (error) {
        console.error('Get messages error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const userId = req.user._id;

        // Validation
        if (!conversationId || !content) {
            return res.status(400).json({ error: 'Conversation ID and content are required' });
        }

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Content must be a non-empty string' });
        }

        if (content.length > 5000) {
            return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
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

        // Create message
        const message = await Message.create({
            conversation: conversationId,
            sender: userId,
            content: content.trim(),
            type: 'TEXT'
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
        console.error('Send message error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Invite external user via email
export const inviteExternalUser = async (req, res) => {
    try {
        const { conversationId } = req.params;  // Get from URL params
        const { email } = req.body;
        const userId = req.user._id;

        // Validation
        if (!conversationId || !email) {
            return res.status(400).json({ error: 'Conversation ID and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Get conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Verify user is admin
        const isAdmin = conversation.admins.some(a => a.toString() === userId.toString());
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can invite users' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            // Add directly to conversation if not already a participant
            const isParticipant = conversation.participants.some(
                p => p.toString() === existingUser._id.toString()
            );

            if (isParticipant) {
                return res.status(400).json({ error: 'User is already a participant' });
            }

            conversation.participants.push(existingUser._id);
            await conversation.save();

            // Emit socket event
            try {
                const io = getIO();
                io.to(`user_${existingUser._id}`).emit('added-to-conversation', conversation);
            } catch (socketError) {
                console.error('Socket emit error:', socketError);
            }

            return res.status(200).json({ message: 'User added to conversation' });
        }

        // Check if already invited
        const existingInvite = conversation.pendingInvites.find(
            inv => inv.email === email.toLowerCase() && inv.status === 'PENDING'
        );
        if (existingInvite) {
            return res.status(400).json({ error: 'Invitation already sent' });
        }

        // Add to pending invites
        conversation.pendingInvites.push({
            email: email.toLowerCase(),
            invitedBy: userId,
            status: 'PENDING'
        });
        await conversation.save();

        // Check if user exists and send in-app notification
        const invitedUser = await User.findOne({ email: email.toLowerCase() });
        if (invitedUser) {
            // User exists - send socket notification
            try {
                const io = getIO();
                const invitationData = {
                    _id: conversationId,
                    conversationId,
                    conversationName: conversation.name || 'Group Chat',
                    invitedBy: {
                        _id: userId,
                        name: req.user.name,
                        email: req.user.email
                    },
                    invitedAt: new Date(),
                    type: 'CHAT_INVITATION'
                };
                io.to(`user_${invitedUser._id}`).emit('chat-invitation', invitationData);
                console.log(`📧 In-app notification sent to ${invitedUser.email}`);
            } catch (socketError) {
                console.error('Socket emit error:', socketError);
            }
        } else {
            // User doesn't exist - send email invitation
            try {
                await sendGroupInvitationEmail(
                    email,
                    req.user.name,
                    conversation.name || 'a group chat',
                    conversationId
                );
                console.log(`📧 Email invitation sent to ${email}`);
            } catch (emailError) {
                console.error('Email send error:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(200).json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Invite external user error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Accept invitation (called when user signs up or clicks link)
export const acceptInvitation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const userEmail = req.user.email;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Find pending invite
        const inviteIndex = conversation.pendingInvites.findIndex(
            inv => inv.email === userEmail.toLowerCase() && inv.status === 'PENDING'
        );

        if (inviteIndex === -1) {
            return res.status(404).json({ error: 'No pending invitation found' });
        }

        // Update invite status
        conversation.pendingInvites[inviteIndex].status = 'ACCEPTED';

        // Add user to participants
        if (!conversation.participants.includes(userId)) {
            conversation.participants.push(userId);
        }

        await conversation.save();

        const populatedConversation = await Conversation.findById(conversationId)
            .populate('participants', 'name email')
            .populate('admins', 'name email');

        // Emit socket event
        try {
            const io = getIO();
            conversation.participants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('user-joined-conversation', {
                    conversationId,
                    user: { _id: userId, name: req.user.name, email: userEmail }
                });
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json(populatedConversation);
    } catch (error) {
        console.error('Accept invitation error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Get pending chat invitations for current user
export const getPendingInvitations = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const conversations = await Conversation.find({
            'pendingInvites.email': userEmail.toLowerCase(),
            'pendingInvites.status': 'PENDING'
        })
            .populate('pendingInvites.invitedBy', 'name email')
            .lean();

        // Extract only the relevant pending invites
        const pendingInvites = conversations.map(conv => {
            const invite = conv.pendingInvites.find(
                inv => inv.email === userEmail.toLowerCase() && inv.status === 'PENDING'
            );
            return {
                _id: conv._id,
                conversationId: conv._id,
                conversationName: conv.name || 'Group Chat',
                invitedBy: invite.invitedBy,
                invitedAt: invite.invitedAt,
                type: 'CHAT_INVITATION'
            };
        });

        res.status(200).json(pendingInvites);
    } catch (error) {
        console.error('Get pending invitations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Hide conversation (delete from user's side)
export const hideConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Verify user is participant
        const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Add user to hiddenBy array if not already there
        if (!conversation.hiddenBy.includes(userId)) {
            conversation.hiddenBy.push(userId);
            await conversation.save();
        }

        res.status(200).json({ message: 'Conversation hidden successfully' });
    } catch (error) {
        console.error('Hide conversation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete message (unsend for everyone)
export const deleteMessage = async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const userId = req.user._id;

        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Verify user is the sender
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        // Check if message is within 15-minute window
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        if (messageAge > fifteenMinutes) {
            return res.status(400).json({ error: 'Messages can only be deleted within 15 minutes' });
        }

        // Delete the message
        await message.deleteOne();

        // Emit socket event to all participants
        try {
            const conversation = await Conversation.findById(conversationId);
            const io = getIO();
            conversation.participants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('message-deleted', {
                    conversationId,
                    messageId
                });
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
