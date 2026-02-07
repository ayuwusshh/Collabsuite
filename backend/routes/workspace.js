import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createWorkspace,
    getWorkspaces,
    getWorkspace,
    addMember,
    deleteWorkspace,
    leaveWorkspace
} from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);
router.get("/:id", protect, getWorkspace);
router.post("/:id/members", protect, addMember);
router.delete("/:id", protect, deleteWorkspace);
router.post("/:id/leave", protect, leaveWorkspace);

export default router;
