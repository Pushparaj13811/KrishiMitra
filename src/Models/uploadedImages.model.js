import mongoose, { Schema } from "mongoose";

const uploadedImageSchema = new Schema(
  {
    imageUrl: {
      type: String,
      require: true,
    },
    diseaseDiagnosis: {
      type: String,
    },
    solution: {
      type: String,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const uploadImage = mongoose.model("uploadImage", uploadedImageSchema);
