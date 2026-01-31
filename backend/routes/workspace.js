import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createWorkspace,
    getWorkspaces,
    getWorkspace,
    addMember
} from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);
router.get("/:id", protect, getWorkspace);
router.post("/:id/members", protect, addMember);

export default router;
