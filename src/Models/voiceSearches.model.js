import mongoose, { Schema } from "mongoose";

const VoiceSearchSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    query: {
      type: String,
      required: true,
    },
    result: {
      type: [String],
      required: true,
    },
    language: {
      type: String,
      enum: ["english", "hindi"],
      required: true,
    },
  },
  { timestamps: true }
);

export const VoiceSearch = mongoose.model("VoiceSearch", VoiceSearchSchema);
