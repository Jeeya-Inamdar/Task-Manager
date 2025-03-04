import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    notes: { type: String },
    remindOnDate: { type: Date },
    remindOnTime: { type: String },
    location: { type: String },
    meetingWith: { type: String },
    earlyReminder: { type: Boolean, default: false },
    repeat: { type: String, enum: ["daily", "weekly", "monthly", "custom"] },
    flagged: { type: Boolean, default: false },

    priority: {
      type: String,
      default: "normal",
      enum: ["low", "medium", "high"],
    },

    stage: {
      type: String,
      default: "todo",
      enum: ["todo", "in progress", "completed"],
    },

    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
          ],
        },
        activity: String,
        date: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    subTasks: [
      {
        title: String,
        date: Date,
        tag: String,
      },
    ],

    assets: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
