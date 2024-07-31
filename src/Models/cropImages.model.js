import mongoose, { Schema } from "mongoose";

const CropImageSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CropImage = mongoose.model("CropImage", CropImageSchema);
