import mongoose, { Schema } from "mongoose";

const CropVideoSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  { timestamps: true }
);

export const CropVideo = mongoose.model("CropVideo", CropVideoSchema);
