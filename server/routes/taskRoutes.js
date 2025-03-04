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
  addAttachment, // New - Add attachment to a task
  removeAttachment, // New - Remove attachment from a task
  getAttachments, // New - Get all attachments of a task
} from "../controllers/taskController.js";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewave.js";

import upload from "../middlewares/uploadMiddleware.js";
const router = express.Router();

// Task-related routes
router.post(
  "/create",
  protectRoute,
  isAdminRoute,
  upload.array("attachments", 1000),
  createTask
);

router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);

router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/view", protectRoute, getTasksByView); // New - Get tasks by view type
router.get("/:id", protectRoute, getTask);

// Subtask and Update routes
router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, isAdminRoute, updateTask);
router.put("/:id", protectRoute, isAdminRoute, trashTask);

// Attachment-related routes
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

// Task delete/restore routes
router.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

export default router;
