import mongoose, { Schema } from "mongoose";

const CropImageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    image: {
      type: String,
      required: true,
    },
    prediction: {
      type: Object,
      required: true,
    },
    recommendations : {
      type: Object,
    }
  },
  {
    timestamps: true,
  }
);

export const CropImage = mongoose.model("CropImage", CropImageSchema);
