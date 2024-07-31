import mongoose, { Schema } from "mongoose";

const CropArticleSchema = new Schema(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: "Crop",
    },
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "Article",
    },
  },
  {
    timestamps: true,
  }
);

export const CropArticle = mongoose.model("CropArticle", CropArticleSchema);
