import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import { getIO } from "../socket.js";

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { title, description, workspaceId, assignedTo, dueDate } = req.body;

        // Input validation
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: "Title is required and must be a non-empty string" });
        }

        if (!workspaceId || typeof workspaceId !== 'string') {
            return res.status(400).json({ error: "Valid workspace ID is required" });
        }

        // Verify workspace exists and user has access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (!workspace.users || !workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Sanitize and validate inputs
        const sanitizedTitle = title.trim().substring(0, 200); // Limit title length
        const sanitizedDescription = description ? String(description).trim().substring(0, 1000) : "";

        const task = await Task.create({
            title: sanitizedTitle,
            description: sanitizedDescription,
            workspace: workspaceId,
            createdBy: req.user._id,
            assignedTo: assignedTo || null,
            dueDate: dueDate || null
        });

        // Emit socket event for real-time updates
        try {
            const io = getIO();
            if (io) {
                io.to(`workspace_${workspaceId}`).emit("task-created", task);
            }
        } catch (socketError) {
            console.error("Socket emit error:", socketError);
            // Don't fail the request if socket fails
        }

        res.status(201).json(task);
    } catch (error) {
        console.error("Create task error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};

// Get all tasks in a workspace
export const getTasks = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Validate workspace ID
        if (!workspaceId || typeof workspaceId !== 'string') {
            return res.status(400).json({ error: "Valid workspace ID is required" });
        }

        // Verify workspace exists and user has access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (!workspace.users || !workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "Access denied" });
        }

        const tasks = await Task.find({ workspace: workspaceId })
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance

        res.json(tasks || []);
    } catch (error) {
        console.error("Get tasks error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid workspace ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};

// Update task status (for drag & drop)
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        console.log('📥 Received status update request:', { id, status, body: req.body, params: req.params });

        // Validate inputs
        if (!id || typeof id !== 'string') {
            console.log('❌ Validation failed: Invalid task ID');
            return res.status(400).json({ error: "Valid task ID is required" });
        }

        if (!status || typeof status !== 'string') {
            console.log('❌ Validation failed: Invalid status type', { status, type: typeof status });
            return res.status(400).json({ error: "Status is required and must be a string" });
        }

        // Validate status value
        const validStatuses = ['todo', 'in_progress', 'done'];
        if (!validStatuses.includes(status)) {
            console.log('❌ Validation failed: Invalid status value', { status, validStatuses });
            return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
        }

        const task = await Task.findById(id);
        if (!task) {
            console.log('❌ Task not found:', id);
            return res.status(404).json({ error: "Task not found" });
        }

        // Verify workspace access
        const workspace = await Workspace.findById(task.workspace);
        if (!workspace) {
            console.log('❌ Workspace not found:', task.workspace);
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (!workspace.users || !workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString())) {
            console.log('❌ Access denied for user:', req.user._id);
            return res.status(403).json({ error: "Access denied" });
        }

        task.status = status;
        await task.save();

        console.log('✅ Task status updated successfully:', { taskId: task._id, newStatus: status });

        // Emit socket event for real-time updates
        try {
            const io = getIO();
            const workspaceId = task.workspace.toString();
            console.log(`📡 Emitting task-status-updated to workspace_${workspaceId}`, { taskId: task._id, status });
            if (io) {
                io.to(`workspace_${workspaceId}`).emit("task-status-updated", task);
            }
        } catch (socketError) {
            console.error("Socket emit error:", socketError);
            // Don't fail the request if socket fails
        }

        res.json(task);
    } catch (error) {
        console.error("Update task status error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Server error" });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const { title, assignedTo, dueDate, status } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        if (title) task.title = title;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (status) task.status = status;

        await task.save();
        res.json(task);
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "Valid task ID is required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Verify workspace access
        const workspace = await Workspace.findById(task.workspace);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (!workspace.users || !workspace.users.some(u => u.user && u.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "Access denied" });
        }

        const workspaceId = task.workspace.toString();
        const taskId = task._id.toString();

        await task.deleteOne();

        // Emit socket event for real-time updates
        try {
            const io = getIO();
            console.log(`🗑️ Emitting task-deleted to workspace_${workspaceId}`, { taskId });
            if (io) {
                io.to(`workspace_${workspaceId}`).emit("task-deleted", { taskId });
            }
        } catch (socketError) {
            console.error("Socket emit error:", socketError);
            // Don't fail the request if socket fails
        }

        res.json({ message: "Task deleted" });
    } catch (error) {
        console.error("Delete task error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid task ID format" });
        }
        res.status(500).json({ error: "Server error" });
    }
};
