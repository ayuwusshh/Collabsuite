import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Document from "../models/Document.js";

// Create a new workspace
export const createWorkspace = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Workspace name is required" });
        }

        const workspace = await Workspace.create({
            name,
            users: [{ user: req.user._id, role: "owner" }]
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
            "users.user": req.user._id
        }).populate("users.user", "name email");

        // Add user's role to each workspace
        const workspacesWithRole = workspaces.map(ws => {
            const userEntry = ws.users.find(u => u.user._id.toString() === req.user._id.toString());
            return {
                ...ws.toObject(),
                userRole: userEntry?.role || "member"
            };
        });

        res.json(workspacesWithRole);
    } catch (error) {
        console.error("Get workspaces error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get single workspace
export const getWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate("users.user", "name email");

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if user has access
        const userEntry = workspace.users.find(u => u.user._id.toString() === req.user._id.toString());
        if (!userEntry) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json({ ...workspace.toObject(), userRole: userEntry.role });
    } catch (error) {
        console.error("Get workspace error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const { email, role = "member" } = req.body;
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
        if (workspace.users.some(u => u.user.toString() === user._id.toString())) {
            return res.status(400).json({ error: "User already a member" });
        }

        workspace.users.push({ user: user._id, role });
        await workspace.save();

        user.workspaces.push(workspace._id);
        await user.save();

        res.json({ message: "Member added successfully", workspace });
    } catch (error) {
        console.error("Add member error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Delete workspace (owner only)
export const deleteWorkspace = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if user is the owner
        const userEntry = workspace.users.find(u => u.user.toString() === req.user._id.toString());
        if (!userEntry || userEntry.role !== "owner") {
            return res.status(403).json({ error: "Only workspace owners can delete workspaces" });
        }

        // Delete all tasks in this workspace
        await Task.deleteMany({ workspace: workspaceId });

        // Delete all documents in this workspace
        await Document.deleteMany({ workspace: workspaceId });

        // Remove workspace from all users' workspace arrays
        await User.updateMany(
            { workspaces: workspaceId },
            { $pull: { workspaces: workspaceId } }
        );

        // Delete the workspace
        await workspace.deleteOne();

        res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
        console.error("Delete workspace error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Leave workspace
export const leaveWorkspace = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if user is the owner
        const userEntry = workspace.users.find(u => u.user.toString() === req.user._id.toString());
        if (!userEntry) {
            return res.status(403).json({ error: "You are not a member of this workspace" });
        }

        if (userEntry.role === "owner") {
            return res.status(400).json({ error: "Owners cannot leave their own workspace. Delete it instead." });
        }

        // Remove user from workspace
        workspace.users = workspace.users.filter(u => u.user.toString() !== req.user._id.toString());
        await workspace.save();

        // Remove workspace from user's list
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { workspaces: workspaceId }
        });

        res.json({ message: "Left workspace successfully" });
    } catch (error) {
        console.error("Leave workspace error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
