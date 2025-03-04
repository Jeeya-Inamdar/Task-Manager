import Notice from "../models/notification.js";
import upload from "../middlewares/uploadMiddleware.js";
import Task from "../models/task.js";
import Attachment from "../models/attachment.js";
import User from "../models/user.js";
import s3 from "../awsConfig.js";
import dotenv from "dotenv";

dotenv.config();

export const createTask = async (req, res) => {
  try {
    upload.array("attachments", 5)(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ status: false, message: err.message });
      }

      const { userId } = req.user;
      const {
        title,
        notes,
        remindOnDate,
        remindOnTime,
        location,
        meetingWith,
        earlyReminder,
        repeat,
        flagged,
        priority,
        stage,
        type,
        date,
        assets,
        team,
      } = req.body;

      let text = "New task has been assigned to you";
      if (team?.length > 1) {
        text += ` and ${team.length - 1} ${
          team.length === 2 ? "other" : "others"
        }.`;
      }
      text += ` The task priority is set to ${priority}. The due date is ${new Date(
        date
      ).toDateString()}. Thank you!!!`;

      const activity = {
        type: "assigned",
        activity: text,
        by: userId,
      };

      const task = await Task.create({
        title,
        notes,
        remindOnDate,
        remindOnTime,
        location,
        meetingWith,
        earlyReminder,
        repeat,
        flagged,
        priority: priority.toLowerCase(),
        stage: stage.toLowerCase(),
        type,
        date,
        by: userId,
        isTrashed: false,
        activities: [activity],
        assets: [],
        team,
      });

      let attachmentIds = [];
      if (assets && assets.length > 0) {
        const attachments = await Attachment.insertMany(
          assets.map((url) => ({
            task: task._id,
            url,
            uploadedBy: userId,
          }))
        );
        attachmentIds = attachments.map((att) => att._id);
      }

      task.assets = attachmentIds;
      await task.save();

      await Notice.create({
        team,
        text,
        task: task._id,
      });

      res
        .status(200)
        .json({ status: true, task, message: "Task created successfully." });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// export const createTask = async (req, res) => {
//   try {
//     console.log("Files received:", req.files);
//     console.log("Body received:", req.body);

//     const { userId } = req.user;
//     const {
//       title,
//       notes,
//       remindOnDate,
//       remindOnTime,
//       location,
//       meetingWith,
//       earlyReminder,
//       repeat,
//       flagged,
//       priority,
//       stage,
//       type,
//       date,
//       team,
//     } = req.body;

//     // Prepare activity message
//     let text = "New task has been assigned to you";
//     if (team?.length > 1) {
//       text += ` and ${team.length - 1} ${
//         team.length === 2 ? "other" : "others"
//       }.`;
//     }
//     text += ` The task priority is set to ${priority}. The due date is ${new Date(
//       date
//     ).toDateString()}. Thank you!!!`;

//     const activity = {
//       type: "assigned",
//       activity: text,
//       by: userId,
//     };

//     // Create Task
//     const task = await Task.create({
//       title,
//       notes,
//       remindOnDate,
//       remindOnTime,
//       location,
//       meetingWith,
//       earlyReminder,
//       repeat,
//       flagged,
//       priority: priority.toLowerCase(),
//       stage: stage.toLowerCase(),
//       type,
//       date,
//       by: userId,
//       isTrashed: false,
//       activities: [activity],
//       assets: [],
//       team,
//     });

//     let attachmentIds = [];

//     // 🔹 Upload Files to S3 and Store in DB
//     console.log(req.files);
//     if (req.files && req.files.length > 0) {
//       const uploadPromises = req.files.map(async (file) => {
//         const fileUrl = await uploadToS3(file); // Upload to S3
//         const attachment = await Attachment.create({
//           task: task._id,
//           url: fileUrl,
//           fileType: file.mimetype,
//           uploadedBy: userId,
//         });
//         return attachment._id;
//       });

//       attachmentIds = await Promise.all(uploadPromises);
//     }
// aoo
//     // 🔹 Store Attachments in Task
//     task.assets = attachmentIds;
//     await task.save();

//     // 🔹 Create Notification
//     await Notice.create({
//       team,
//       text,
//       task: task._id,
//     });

//     res.status(200).json({
//       status: true,
//       task,
//       message: "Task created successfully.",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ status: false, message: error.message });
//   }
// };

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const originalTask = await Task.findById(id).lean();
    if (!originalTask) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    const newTask = await Task.create({
      ...originalTask,
      _id: undefined, // Remove original ID to allow MongoDB to generate a new one
      title: originalTask.title + " - Duplicate",
      activities: [
        {
          type: "assigned",
          activity: "Duplicated task created from: " + originalTask.title,
          by: req.user.userId,
        },
      ],
      isTrashed: false,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await Notice.create({
      team: newTask.team,
      text: `A duplicate of the task "${originalTask.title}" has been created.`,
      task: newTask._id,
    });

    res.status(200).json({
      status: true,
      message: "Task duplicated successfully.",
      task: newTask,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;

    const task = await Task.findById(id);

    const data = {
      type,
      activity,
      by: userId,
    };

    task.activities.push(data);

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 })
      : await Task.find({
          isTrashed: false,
          team: { $all: [userId] },
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //   group task by stage and calculate counts
    const groupTaskks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    // Group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTaskks,
      graphData: groupData,
    };

    res.status(200).json({
      status: true,
      message: "Successfully",
      ...summary,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;

    let query = {};

    // Convert isTrashed to boolean
    if (isTrashed !== undefined) {
      query.isTrashed = isTrashed === "true";
    }

    // Normalize stage to lowercase if provided
    if (stage) {
      query.stage = stage.toLowerCase();
    }

    console.log("Query:", query); // Debugging: Log query before execution

    let queryResult = Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });

    const tasks = await queryResult;

    console.log("Tasks Found:", tasks.length); // Debugging: Log task count

    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;

    const { id } = req.params;

    const newSubTask = {
      title,
      date,
      tag,
    };

    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// export const updateTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, date, team, stage, priority, assets } = req.body;

//     const task = await Task.findById(id.trim());
//     if (!task) {
//       return res.status(404).json({ status: false, message: "Task not found" });
//     }

//     task.title = title;
//     task.date = date;
//     task.priority = priority.toLowerCase();
//     task.assets = assets;
//     task.stage = stage.toLowerCase();
//     task.team = team;

//     await task.save();

//     res
//       .status(200)
//       .json({ status: true, message: "Task updated successfully." });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Task ID is required" });
    }

    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    let attachmentIds = [...task.assets]; // Preserve existing attachments

    if (assets && assets.length > 0) {
      const newAttachments = await Attachment.insertMany(
        assets.map((url) => ({
          task: id,
          url,
          uploadedBy: req.user.userId,
        }))
      );
      attachmentIds = [
        ...attachmentIds,
        ...newAttachments.map((att) => att._id),
      ];
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id.trim(),
      {
        ...(title && { title }),
        ...(date && { date }),
        ...(priority && { priority: priority.toLowerCase() }),
        ...(stage && { stage: stage.toLowerCase() }),
        ...(assets && { assets }),
        ...(team && { team }),
        assets: attachmentIds,
      },
      { new: true, runValidators: true } // Return updated document & validate fields
    );

    if (!updatedTask) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    res.status(200).json({
      status: true,
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    task.isTrashed = true;

    await task.save();

    res.status(200).json({
      status: true,
      message: `Task trashed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);

      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res.status(200).json({
      status: true,
      message: `Operation performed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const getTasksByView = async (req, res) => {
  try {
    const { viewType } = req.query;
    const { userId } = req.user;

    let filter = { isTrashed: false, team: { $all: [userId] } };

    switch (viewType) {
      case "today":
        // filter.remindOnDate = { $eq: new Date().setHours(0, 0, 0, 0) };
        filter.remindOnDate = {
          $eq: new Date().toISOString().split("T")[0], // Fix date issue
        };
        break;
      case "scheduled":
        filter.remindOnDate = { $gt: new Date() };
        break;
      case "flagged":
        filter.flagged = true;
        break;
      case "completed":
        filter.stage = "completed";
        //filter.stage = { $regex: new RegExp("^completed$", "i") };
        break;
      case "all":
      default:
        break;
    }

    console.log("Task Filter:", filter);
    const tasks = await Task.find(filter)
      .populate("team", "name email")
      .populate("assets");

    res.status(200).json({ status: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

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

    // Upload file to S3
    const fileUrl = await uploadToS3(req.file);

    // Create attachment entry in DB
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

    await Task.findByIdAndUpdate(attachment.task, {
      $pull: { assets: attachmentId },
    });
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
