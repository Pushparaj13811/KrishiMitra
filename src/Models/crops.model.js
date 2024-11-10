import mongoose, { Schema } from "mongoose";

const CropSchema = new Schema(
  {
    cropName: {
      type: String,
      required: true,
    },
    scientificName: {
      type: String,
    },
    description: {
      type: String,
    },
    costPerAcres: {
      type: Number,
    },
    requiredSoilType: {
      type: String,
    },
    diseasesRisk: {
      type: String,
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
