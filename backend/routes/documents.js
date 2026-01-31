import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createDocument,
    getDocuments,
    getDocument,
    saveDocument,
    deleteDocument
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", protect, createDocument);
router.get("/workspace/:workspaceId", protect, getDocuments);
router.get("/:id", protect, getDocument);
router.put("/:id", protect, saveDocument);
router.delete("/:id", protect, deleteDocument);

export default router;
