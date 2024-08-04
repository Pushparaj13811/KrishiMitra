import mongoose, { Schema } from "mongoose";

const ArticlesSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    language: {
      type: String,
      enum: ["english", "hindi"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Article = mongoose.model("Article", ArticlesSchema);
