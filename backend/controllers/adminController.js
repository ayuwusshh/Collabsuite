import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

// Remove member from group (admin only)
export const removeMember = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId: memberToRemove } = req.body;
        const currentUserId = req.user._id;

        if (!memberToRemove) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Only GROUP and WORKSPACE types can have members removed
        if (conversation.type === 'DIRECT') {
            return res.status(400).json({ error: 'Cannot remove members from direct messages' });
        }

        // Check if current user is admin
        const isAdmin = conversation.admins.some(a => a.toString() === currentUserId.toString());
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }

        // Cannot remove yourself (use leave instead)
        if (memberToRemove === currentUserId.toString()) {
            return res.status(400).json({ error: 'Use leave endpoint to remove yourself' });
        }

        // Remove member
        conversation.participants = conversation.participants.filter(
            p => p.toString() !== memberToRemove
        );
        conversation.admins = conversation.admins.filter(
            a => a.toString() !== memberToRemove
        );
        await conversation.save();

        // Emit socket event
        try {
            const io = getIO();
            io.to(`user_${memberToRemove}`).emit('removed-from-conversation', { conversationId });
            conversation.participants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('member-removed', { conversationId, userId: memberToRemove });
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete group (admin only)
export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Only GROUP and WORKSPACE types can be deleted
        if (conversation.type === 'DIRECT') {
            return res.status(400).json({ error: 'Cannot delete direct messages' });
        }

        // Check if user is admin
        const isAdmin = conversation.admins.some(a => a.toString() === userId.toString());
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can delete groups' });
        }

        // Delete all messages in the conversation
        await Message.deleteMany({ conversation: conversationId });

        // Delete the conversation
        await conversation.deleteOne();

        // Emit socket event to all participants
        try {
            const io = getIO();
            conversation.participants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('conversation-deleted', { conversationId });
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Leave group (any member)
export const leaveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Cannot leave direct messages
        if (conversation.type === 'DIRECT') {
            return res.status(400).json({ error: 'Cannot leave direct messages' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) {
            return res.status(400).json({ error: 'You are not a member of this conversation' });
        }

        // If user is the last admin, prevent leaving
        const isAdmin = conversation.admins.some(a => a.toString() === userId.toString());
        if (isAdmin && conversation.admins.length === 1 && conversation.participants.length > 1) {
            return res.status(400).json({ error: 'Cannot leave as the only admin. Delete the group or assign another admin first.' });
        }

        // Remove user from participants and admins
        conversation.participants = conversation.participants.filter(p => p.toString() !== userId.toString());
        conversation.admins = conversation.admins.filter(a => a.toString() !== userId.toString());

        // If no participants left, delete the conversation
        if (conversation.participants.length === 0) {
            await Message.deleteMany({ conversation: conversationId });
            await conversation.deleteOne();
        } else {
            await conversation.save();
        }

        // Emit socket event
        try {
            const io = getIO();
            conversation.participants.forEach(participantId => {
                io.to(`user_${participantId}`).emit('member-left', { conversationId, userId });
            });
        } catch (socketError) {
            console.error('Socket emit error:', socketError);
        }

        res.status(200).json({ message: 'Left conversation successfully' });
    } catch (error) {
        console.error('Leave conversation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
