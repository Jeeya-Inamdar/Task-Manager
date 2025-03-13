import Task from "../models/task.js";
import User from "../models/user.js";
import Attachment from "../models/Attachment.js";
import s3 from "../awsConfig.js";
import dotenv from "dotenv";

dotenv.config();
export const uploadToS3 = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error("No file buffer found for upload.");
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    return uploadResult.Location; // Return file URL
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("File upload failed.");
  }
};

// Add a new function to handle voice note uploads
//* ATTACHMENTS

export const addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.user;

    // Validate uploaded file
    if (!req.file) {
      return res
        .status(400)
        .json({ status: false, message: "No file uploaded." });
    }

    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found." });
    }

    //! Upload file to S3
    const fileUrl = await uploadToS3(req.file);

    //! Create attachment entry in DB
    const attachment = await Attachment.create({
      task: taskId,
      url: fileUrl, // Use S3 URL
      fileType: req.file.mimetype,
      uploadedBy: userId,
    });

    // Link attachment to task
    task.assets.push(attachment._id);
    await task.save();
    console.log("Received file:", req.file);

    // Send success response
    res.status(201).json({
      status: true,
      attachment,
      message: "Attachment uploaded successfully.",
    });
  } catch (error) {
    console.error("Error in addAttachment:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

export const removeAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const task = await Task.findOne({ "notes.voiceNote": attachmentId });

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res
        .status(404)
        .json({ status: false, message: "Attachment not found" });
    }

    const fileKey = attachment.url.split(".com/")[1];
    await s3
      .deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: fileKey })
      .promise();

    //*CHECK IF THIS IS ATTACHMENT IS A VOICE NOTE IN ANY TASK
    if (task) {
      // Remove the voice note reference
      task.notes.voiceNote = undefined;
      await task.save();
    } else {
      // Remove from regular assets
      await Task.findByIdAndUpdate(attachment.task, {
        $pull: { assets: attachmentId },
      });
    }
    await Attachment.findByIdAndDelete(attachmentId);

    res
      .status(200)
      .json({ status: true, message: "Attachment removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
export const getAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.find({ task: taskId }).populate(
      "uploadedBy",
      "name email"
    );

    res.status(200).json({ status: true, attachments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//* NOTES
export const addVoiceNote = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.user; // Or use alternative authentication as discussed

    // Validate uploaded file
    if (!req.file) {
      return res
        .status(400)
        .json({ status: false, message: "No voice note file uploaded." });
    }

    // Check if file is audio
    if (!req.file.mimetype.startsWith("audio/")) {
      return res
        .status(400)
        .json({ status: false, message: "File must be an audio file." });
    }

    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found." });
    }

    // Upload file to S3
    const fileUrl = await uploadToS3(req.file);

    // Create attachment entry in DB
    const attachment = await Attachment.create({
      task: taskId,
      url: fileUrl,
      fileType: req.file.mimetype,
      uploadedBy: userId,
    });

    // If task.notes is a string, convert it to an object
    let existingNotes = task.notes;
    let notesObject = {};

    if (typeof existingNotes === "string") {
      notesObject.text = existingNotes;
    } else if (existingNotes && typeof existingNotes === "object") {
      notesObject = existingNotes;
    }

    // Ensure voiceNote is an array
    if (!Array.isArray(notesObject.voiceNote)) {
      notesObject.voiceNote = [];
    }

    // Add the new voice note to the array
    notesObject.voiceNote.push(attachment._id);

    // Update the task
    task.notes = notesObject;
    await task.save();

    res.status(201).json({
      status: true,
      voiceNote: attachment,
      message: "Voice note added successfully.",
    });
  } catch (error) {
    console.error("Error in addVoiceNote:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

export const deleteNotes = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { field } = req.body; // Expecting 'text' or 'voiceNote'

    // Validate input
    if (!field || (field !== "text" && field !== "voiceNote")) {
      return res.status(400).json({
        status: false,
        message: "Invalid field. Must be 'text' or 'voiceNote'.",
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found." });
    }

    // Ensure notes exist
    if (!task.notes || typeof task.notes !== "object") {
      return res
        .status(400)
        .json({ status: false, message: "No notes found for this task." });
    }

    // Handle deletion based on field type
    if (field === "voiceNote") {
      if (!task.notes.voiceNote) {
        return res.status(400).json({
          status: false,
          message: "No voice note found in this task.",
        });
      }

      const attachmentId = task.notes.voiceNote;

      // Find and delete the voice note attachment
      const attachment = await Attachment.findById(attachmentId);
      if (attachment) {
        // Delete file from S3
        const fileKey = attachment.url.split(".com/")[1];
        await s3
          .deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
          })
          .promise();

        // Delete attachment record from DB
        await Attachment.findByIdAndDelete(attachmentId);

        // Remove from task assets
        task.assets = task.assets.filter(
          (assetId) => assetId.toString() !== attachmentId.toString()
        );
      }

      // Remove voiceNote from notes
      delete task.notes.voiceNote;
    } else if (field === "text") {
      if (!task.notes.text) {
        return res.status(400).json({
          status: false,
          message: "No text note found in this task.",
        });
      }

      // Remove text field from notes
      delete task.notes.text;
    }

    // Save updated task
    await task.save();

    res
      .status(200)
      .json({ status: true, message: `${field} deleted successfully.` });
  } catch (error) {
    console.error("Error in deleteNotesField:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
export const getNotesByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate taskId
    if (!taskId) {
      return res
        .status(400)
        .json({ status: false, message: "Task ID is required." });
    }

    // Find task and populate voiceNote details
    const task = await Task.findById(taskId).populate("notes.voiceNote");

    if (!task) {
      return res
        .status(404)
        .json({ status: false, message: "Task not found." });
    }

    // Extract notes
    const notesData = {
      text: task.notes?.text || "",
      voiceNote: task.notes?.voiceNote
        ? {
            id: task.notes.voiceNote._id,
            url: task.notes.voiceNote.url,
            fileType: task.notes.voiceNote.fileType,
          }
        : null,
    };

    res.status(200).json({
      status: true,
      notes: notesData,
      message: "Notes retrieved successfully.",
    });
  } catch (error) {
    console.error("Error in getNotesByTaskId:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
