import mongoose, { Schema } from "mongoose";

const CropSchema = new Schema(
  {
    cropName: {
      type: String,
      required: true,
    },
    scientificName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    costPerAcres: {
      type: Number,
      required: true,
    },
    requiredSoilType: {
      type: String,
      required: true,
    },
    diseasesRisk: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Crop = mongoose.model("Crop", CropSchema);
