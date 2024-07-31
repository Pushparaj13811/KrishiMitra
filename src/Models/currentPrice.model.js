import mongoose, { Schema } from "mongoose";

const CurrentPriceSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    price: {
      type: Number > 0,
      required: true,
    },
    currency: {
      type: String,
      enum: ["Npr", "Inr", "Usd"],
      required: true,
    },
  },
  { timestamps: true }
);

export const CurrentPrice = mongoose.model("CurrentPrice", CurrentPriceSchema);
