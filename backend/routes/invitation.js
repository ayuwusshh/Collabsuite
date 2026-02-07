import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    sendInvitation,
    getInvitations,
    acceptInvitation,
    rejectInvitation
} from "../controllers/invitationController.js";

const router = express.Router();

router.post("/send", protect, sendInvitation);
router.get("/", protect, getInvitations);
router.post("/:id/accept", protect, acceptInvitation);
router.post("/:id/reject", protect, rejectInvitation);

export default router;
