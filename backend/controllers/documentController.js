import Document from "../models/Document.js";
import Workspace from "../models/Workspace.js";

export const createDocument = async (req, res) => {
    try {
        const { title, workspaceId } = req.body;

        if (!title || !workspaceId) {
            return res.status(400).json({ error: "Title and workspace are required" });
        }
        const workspace = await Workspace.findById(workspaceId);

        const isMember = workspace?.users.some(u => u.user.toString() === req.user._id.toString());
        if (!workspace || !isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        const document = await Document.create({
            title,
            workspace: workspaceId,
            lastEditedBy: req.user._id
        });

        res.status(201).json(document);
    } catch (error) {
        console.error("Create document error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
export const getDocuments = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await Workspace.findById(workspaceId);

        const isMember = workspace?.users.some(u => u.user.toString() === req.user._id.toString());
        if (!workspace || !isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        const documents = await Document.find({ workspace: workspaceId })
            .populate("lastEditedBy", "name email")
            .sort({ updatedAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
export const getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate("workspace")
            .populate("lastEditedBy", "name email");

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        const workspace = await Workspace.findById(document.workspace._id);
        const isMember = workspace?.users.some(u => u.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(document);
    } catch (error) {
        console.error("Get document error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
export const saveDocument = async (req, res) => {
    try {
        const { content } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        document.content = content;
        document.lastEditedBy = req.user._id;
        await document.save();

        res.json({ message: "Document saved", document });
    } catch (error) {
        console.error("Save document error:", error);
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
