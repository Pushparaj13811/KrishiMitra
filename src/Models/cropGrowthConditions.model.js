import mongoose, { Schema } from "mongoose";

const CropGrowthConditionSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    growthCondition: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CropGrowthCondition = mongoose.model(
  "CropGrowthCondition",
  CropGrowthConditionSchema
);
