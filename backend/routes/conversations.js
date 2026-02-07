import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
    inviteExternalUser,
    acceptInvitation,
    getPendingInvitations,
    hideConversation,
    deleteMessage
} from '../controllers/conversationController.js';
import { uploadFile, downloadFile } from '../controllers/fileController.js';
import { removeMember, deleteConversation, leaveConversation } from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Conversation routes
router.post('/', createConversation);
router.get('/', getConversations);
router.get('/pending-invitations', getPendingInvitations);
router.get('/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/:conversationId/invite', inviteExternalUser);
router.post('/:conversationId/accept', acceptInvitation);
router.post('/:conversationId/remove-member', removeMember);
router.delete('/:conversationId', deleteConversation);
router.post('/:conversationId/leave', leaveConversation);

// File upload/download routes
router.post('/:conversationId/upload', upload.single('file'), uploadFile);
router.get('/files/:messageId', downloadFile);

// Hide conversation and delete message routes
router.delete('/:conversationId/hide', hideConversation);
router.delete('/:conversationId/messages/:messageId', deleteMessage);

export default router;
