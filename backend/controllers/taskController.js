import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { title, workspaceId, assignedTo, dueDate } = req.body;

        if (!title || !workspaceId) {
            return res.status(400).json({ error: "Title and workspace are required" });
        }

        // Verify workspace access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace || !workspace.users.includes(req.user._id)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const task = await Task.create({
            title,
            workspace: workspaceId,
            assignedTo: assignedTo || null,
            dueDate: dueDate || null
        });

        res.status(201).json(task);
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get all tasks in a workspace
export const getTasks = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Verify workspace access
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace || !workspace.users.includes(req.user._id)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const tasks = await Task.find({ workspace: workspaceId })
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Update task status (for drag & drop)
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        task.status = status;
        await task.save();

        res.json(task);
    } catch (error) {
        console.error("Update task status error:", error);
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
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        await task.deleteOne();
        res.json({ message: "Task deleted" });
    } catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
