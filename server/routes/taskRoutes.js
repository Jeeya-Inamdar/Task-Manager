import express from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  getTasksByView,
  postTaskActivity,
  trashTask,
  updateTask,
} from "../controllers/taskController.js";

import {
  addAttachment,
  removeAttachment,
  getAttachments,
  addVoiceNote,
  deleteNotes,
  getNotesByTaskId,
} from "../controllers/attachmentController.js";

import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewave.js";
import dotenv from "dotenv";
import upload from "../middlewares/uploadMiddleware.js";
dotenv.config();

const router = express.Router();

//* TASK
router.post(
  "/create",
  protectRoute,
  isAdminRoute,
  upload.array("attachments", 1000),
  createTask
);

router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);

//* DASHBOARD
router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/view", protectRoute, getTasksByView); // New - Get tasks by view type
router.get("/:id", protectRoute, getTask);

//* SUBTASK
router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, isAdminRoute, updateTask);
router.put("/:id", protectRoute, isAdminRoute, trashTask);

//* ATTACHMENT
router.post(
  "/upload-attachment/:taskId",
  protectRoute,
  upload.single("attachment"),
  addAttachment
); // New - Upload attachment
router.get("/attachments/:taskId", protectRoute, getAttachments); // New - Get task attachments
router.delete(
  "/delete-attachment/:attachmentId",
  protectRoute,
  removeAttachment
); // New - Delete attachment

//* NOTES
router.post(
  "/:taskId/voice-note",
  protectRoute,
  upload.single("voiceNote"),
  addVoiceNote
);

router.delete("/:taskId/notes", protectRoute, deleteNotes);
router.get("/:taskId/notes", getNotesByTaskId);

//* Task delete/restore routes
router.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

export default router;

// router.post("/upload-multiple", upload.array("images", 5), (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ error: "Please upload at least one image" });
//   }

//   // Return array of uploaded file URLs
//   const imageUrls = req.files.map((file) => file.location);
//   res.json({ imageUrls });
// });
