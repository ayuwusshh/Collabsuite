import Invitation from "../models/Invitation.js";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";

// Send workspace invitation
export const sendInvitation = async (req, res) => {
    try {
        const { email, role = "member", workspaceId } = req.body; // Get workspaceId from body

        // Find the user to invite
        const invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if workspace exists
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if user is already a member
        if (workspace.users.some(u => u.user.toString() === invitedUser._id.toString())) {
            return res.status(400).json({ error: "User is already a member" });
        }

        // Check if there's already a pending invitation
        const existingInvitation = await Invitation.findOne({
            workspace: workspaceId,
            invitedUser: invitedUser._id,
            status: "pending"
        });

        if (existingInvitation) {
            return res.status(400).json({ error: "Invitation already sent" });
        }

        // Create invitation
        const invitation = await Invitation.create({
            workspace: workspaceId,
            invitedUser: invitedUser._id,
            invitedBy: req.user._id,
            role
        });

        // Populate for response
        await invitation.populate([
            { path: "workspace", select: "name" },
            { path: "invitedBy", select: "name email" }
        ]);

        // Emit socket event to notify the invited user
        const io = getIO();
        io.to(`user_${invitedUser._id}`).emit("workspace-invitation", invitation);

        res.status(201).json({ message: "Invitation sent successfully", invitation });
    } catch (error) {
        console.error("Send invitation error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get all invitations for current user
export const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({
            invitedUser: req.user._id,
            status: "pending"
        })
            .populate("workspace", "name")
            .populate("invitedBy", "name email")
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Accept invitation
export const acceptInvitation = async (req, res) => {
    try {
        const invitationId = req.params.id;

        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: "Invitation not found" });
        }

        // Verify this invitation is for the current user
        if (invitation.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check if invitation is still pending
        if (invitation.status !== "pending") {
            return res.status(400).json({ error: "Invitation already processed" });
        }

        // Add user to workspace
        const workspace = await Workspace.findById(invitation.workspace);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        workspace.users.push({ user: req.user._id, role: invitation.role });
        await workspace.save();

        // Add workspace to user's workspaces
        await User.findByIdAndUpdate(req.user._id, {
            $push: { workspaces: workspace._id }
        });

        // Update invitation status
        invitation.status = "accepted";
        await invitation.save();

        res.json({ message: "Invitation accepted", workspace });
    } catch (error) {
        console.error("Accept invitation error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Reject invitation
export const rejectInvitation = async (req, res) => {
    try {
        const invitationId = req.params.id;

        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: "Invitation not found" });
        }

        // Verify this invitation is for the current user
        if (invitation.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check if invitation is still pending
        if (invitation.status !== "pending") {
            return res.status(400).json({ error: "Invitation already processed" });
        }

        // Update invitation status
        invitation.status = "rejected";
        await invitation.save();

        res.json({ message: "Invitation rejected" });
    } catch (error) {
        console.error("Reject invitation error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
