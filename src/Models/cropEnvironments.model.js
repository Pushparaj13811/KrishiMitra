import mongoose, { Schema } from "mongoose";

const CropEnvironmentSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    environemt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CropEnvironment = mongoose.model(
  "CropEnvironment",
  CropEnvironmentSchema
);
