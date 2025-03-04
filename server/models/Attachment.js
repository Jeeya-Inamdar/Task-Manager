import mongoose, { Schema } from "mongoose";
const attachmentSchema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: "task", required: true },
    url: { type: String, required: true },
    fileType: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },

  { timestamps: true }
);

const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;
