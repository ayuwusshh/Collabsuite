import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createTask,
    getTasks,
    updateTaskStatus,
    updateTask,
    deleteTask
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/", protect, createTask);
router.get("/workspace/:workspaceId", protect, getTasks);
router.patch("/:id/status", protect, updateTaskStatus);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

export default router;
