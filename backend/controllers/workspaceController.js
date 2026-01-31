import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Workspace name is required" });
        }

        const workspace = await Workspace.create({
            name,
            users: [req.user._id]
        });

        // Add workspace to user's workspaces array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { workspaces: workspace._id }
        });

        res.status(201).json(workspace);
    } catch (error) {
        console.error("Create workspace error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get all workspaces for current user
export const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            users: req.user._id
        }).populate("users", "name email");

        res.json(workspaces);
    } catch (error) {
        console.error("Get workspaces error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get single workspace
export const getWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate("users", "name email");

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if user has access
        if (!workspace.users.some(u => u._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(workspace);
    } catch (error) {
        console.error("Get workspace error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const workspaceId = req.params.id;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if already a member
        if (workspace.users.includes(user._id)) {
            return res.status(400).json({ error: "User already a member" });
        }

        workspace.users.push(user._id);
        await workspace.save();

        user.workspaces.push(workspace._id);
        await user.save();

        res.json({ message: "Member added successfully", workspace });
    } catch (error) {
        console.error("Add member error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
