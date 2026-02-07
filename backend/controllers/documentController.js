import Document from "../models/Document.js";
import Workspace from "../models/Workspace.js";
import { getIO } from "../socket.js";

export const createDocument = async (req, res) => {
    try {
        const { title, workspaceId } = req.body;

        // Input validation
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: "Title is required and must be a non-empty string" });
        }

        if (!workspaceId || typeof workspaceId !== 'string') {
            return res.status(400).json({ error: "Valid workspace ID is required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const isMember = workspace?.users && workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Sanitize title
        const sanitizedTitle = title.trim().substring(0, 200);

        const document = await Document.create({
            title: sanitizedTitle,
            workspace: workspaceId,
            lastEditedBy: req.user._id
        });

        // Broadcast to workspace
        try {
            const io = getIO();
            if (io) {
                io.to(`workspace_${workspaceId}`).emit('document-created', document);
            }
        } catch (err) {
            console.error("Socket emit error:", err);
            // Don't fail the request if socket fails
        }

        res.status(201).json(document);
    } catch (error) {
        console.error("Create document error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};
export const getDocuments = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Validate workspace ID
        if (!workspaceId || typeof workspaceId !== 'string') {
            return res.status(400).json({ error: "Valid workspace ID is required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const isMember = workspace?.users && workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        const documents = await Document.find({ workspace: workspaceId })
            .populate("lastEditedBy", "name email")
            .sort({ updatedAt: -1 })
            .lean();

        res.json(documents || []);
    } catch (error) {
        console.error("Get documents error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid workspace ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};
export const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "Valid document ID is required" });
        }

        const document = await Document.findById(id)
            .populate("workspace")
            .populate("lastEditedBy", "name email");

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (!document.workspace || !document.workspace._id) {
            return res.status(500).json({ error: "Document workspace data is corrupted" });
        }

        const workspace = await Workspace.findById(document.workspace._id);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const isMember = workspace?.users && workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(document);
    } catch (error) {
        console.error("Get document error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid document ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};
export const saveDocument = async (req, res) => {
    try {
        const { content } = req.body;
        const { id } = req.params;

        // Validate inputs
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "Valid document ID is required" });
        }

        if (content === undefined || content === null) {
            return res.status(400).json({ error: "Content is required" });
        }

        // Sanitize content (limit size to prevent abuse)
        const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
        const contentStr = String(content);
        if (contentStr.length > MAX_CONTENT_SIZE) {
            return res.status(413).json({ error: "Content too large" });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        document.content = contentStr;
        document.lastEditedBy = req.user._id;
        await document.save();

        res.json({ message: "Document saved", document });
    } catch (error) {
        console.error("Save document error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid document ID format" });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Server error" });
    }
};
export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        await document.deleteOne();
        res.json({ message: "Document deleted" });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
