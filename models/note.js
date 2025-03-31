import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: "User", // The model this field references
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // This will automatically add createdAt and updatedAt
);

export default mongoose.models.Note || mongoose.model("Note", noteSchema);