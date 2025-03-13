import Notice from "../models/notification.js";
//import upload from "../middlewares/uploadMiddleware.js";
import Task from "../models/task.js";
import Attachment from "../models/Attachment.js";
import User from "../models/user.js";
import dotenv from "dotenv";

import moment from "moment";

dotenv.config();

// export const createTask = async (req, res) => {
//   try {
//     upload.array("attachments", 5)(req, res, async (err) => {
//       if (err) {
//         return res.status(500).json({ status: false, message: err.message });
//       }

//       const { userId } = req.user;
//       const {
//         title,
//         notes,
//         remindOnDate,
//         remindOnTime,
//         location,
//         meetingWith,
//         earlyReminder,
//         repeat,
//         flagged,
//         priority,
//         stage,
//         type,
//         date,
//         // assets,
//         team,
//       } = req.body;

//       console.log(req.body);

//       let text = "New task has been assigned to you";
//       if (team?.length > 1) {
//         text += ` and ${team.length - 1} ${
//           team.length === 2 ? "other" : "others"
//         }.`;
//       }
//       text += ` The task priority is set to ${priority}. The due date is ${new Date(
//         date
//       ).toDateString()}. Thank you!!!`;

//       const activity = {
//         type: "assigned",
//         activity: text,
//         by: userId,
//       };

//       const task = await Task.create({
//         title,
//         notes,
//         remindOnDate,
//         remindOnTime,
//         location,
//         meetingWith,
//         earlyReminder,
//         repeat,
//         flagged,
//         priority: priority.toLowerCase(),
//         stage: stage.toLowerCase(),
//         type,
//         date,
//         by: userId,
//         isTrashed: false,
//         activities: [activity],
//         assets: [],
//         team,
//       });

//       // let attachmentIds = [];
//       // if (assets && assets.length > 0) {
//       //   const attachments = await Attachment.insertMany(
//       //     assets.map((url) => ({
//       //       task: task._id,
//       //       url,
//       //       uploadedBy: userId,
//       //     }))
//       //   );
//       //   attachmentIds = attachments.map((att) => att._id);
//       // }
//       let attachmentIds = [];
//       if (req.files && req.files.length > 0) {
//         const attachments = await Attachment.insertMany(
//           req.files.map((file) => ({
//             task: task._id,
//             url: `/uploads/${file.filename}`, // Store file path or URL
//             uploadedBy: userId,
//           }))
//         );
//         attachmentIds = attachments.map((att) => att._id);
//       }

//       task.assets = attachmentIds;
//       await task.save();

//       await Notice.create({
//         team,
//         text,
//         task: task._id,
//       });

//       res
//         .status(200)
//         .json({ status: true, task, message: "Task created successfully." });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ status: false, message: error.message });
//   }
// };

export const createTask = async (req, res) => {
  try {
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

    let processedNotes = typeof notes === "string" ? { text: notes } : notes;

    // 🟢 Create Task
    const task = await Task.create({
      title,
      notes: processedNotes,
      remindOnDate, // Convert remindOnDate to Date object using moment
      remindOnTime,
      location,
      meetingWith,
      earlyReminder,
      repeat,
      flagged,
      priority: priority.toLowerCase(),
      stage: stage,
      type,
      date,
      by: userId,
      isTrashed: false,
      activities: [activity],
      assets: [],
      team,
    });

    let attachmentIds = [];
    if (req.files && req.files.length > 0) {
      const attachments = await Attachment.insertMany(
        req.files.map((file) => ({
          task: task._id,
          url: file.location, // ✅ S3 URL
          uploadedBy: userId,
        }))
      );
      attachmentIds = attachments.map((att) => att._id);

      if (req.body.isVoiceNote && req.files.length > 0) {
        const voiceNoteAttachment = attachments.find((att) =>
          att.fileType.startsWith("audio/")
        );
        if (voiceNoteAttachment) {
          task.notes.voiceNote = voiceNoteAttachment._id;
          // If it's a voice note, we might want to keep it out of the regular assets
          attachmentIds = attachments
            .filter(
              (att) => att._id.toString() !== voiceNoteAttachment._id.toString()
            )
            .map((att) => att._id);
        }
      }
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
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

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
// export const getTasks = async (req, res) => {
//   try {
//     const { stage, isTrashed, viewType } = req.query;

//     const { userId } = req.user;

//     let query = { isTrashed: false };

//     if (isTrashed !== undefined) {
//       query.isTrashed = isTrashed === "true";
//     }

//     // Normalize stage to lowercase if provided
//     if (stage) {
//       query.stage = stage.toLowerCase();
//     }

//     console.log("Query:", query); // Debugging: Log query before execution

//     let queryResult = Task.find(query)
//       .populate({
//         path: "team",
//         select: "name title email",
//       })
//       .sort({ _id: -1 });

//     const tasks = await queryResult;

//     console.log("Tasks Found:", tasks.length); // Debugging: Log task count

//     res.status(200).json({
//       status: true,
//       tasks,
//     });
//   } catch (error) {
//     console.error("Error fetching tasks:", error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Internal Server Error" });
//   }
// };

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed, viewType } = req.query;
    const { userId } = req.user;

    let query = { isTrashed: false };

    if (isTrashed !== undefined) {
      query.isTrashed = isTrashed === "true";
    }

    // Get today's date in UTC format
    const today = moment().startOf("day").toISOString();

    // Apply filtering based on viewType
    switch (viewType) {
      case "today":
        query.remindOnDate = today;
        break;
      case "scheduled":
        query.remindOnDate = { $gt: today }; // Future dates
        break;
      case "flagged":
        query.flagged = true;
        break;
      case "completed":
        query.stage = "completed";
        break;
      case "all":
        // No additional filtering needed
        break;
      default:
        if (stage) {
          query.stage = stage.toLowerCase();
        }
        break;
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

    const { title, date, notes, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id.trim());
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Preserve existing attachments
    let attachmentIds = [...task.assets];

    // Handle notes updates while preserving existing voiceNote
    let processedNotes = { ...task.notes }; // Preserve current notes

    if (notes) {
      if (typeof notes === "string") {
        // Update only text if a string is provided
        processedNotes.text = notes;
      } else {
        // Merge updates (allows updating text or voiceNote separately)
        processedNotes = { ...processedNotes, ...notes };
      }
    }

    // Handle asset updates
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

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id.trim(),
      {
        ...(title && { title }),
        notes: processedNotes, // Always update notes (but preserve existing fields)
        ...(date && { date }),
        ...(priority && { priority: priority.toLowerCase() }),
        ...(stage && { stage }), // Keep original casing
        ...(team && { team }),
        assets: attachmentIds, // Update asset list
      },
      { new: true, runValidators: true }
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
