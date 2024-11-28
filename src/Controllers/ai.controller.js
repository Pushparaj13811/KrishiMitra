import { ApiError } from "../Utils/apiError.js";
import { ApiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import { CropImage } from "../Models/cropImages.model.js";
import diseaseRecommendations from "../constant/diseases.js";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import mongoose from "mongoose";

const predictionUrl = `${process.env.AI_BASE_URL}/predict`;

const formatPredictionResponse = (prediction) => {
  return {
    predicted_class: prediction.predicted_class
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
    predicted_crop: prediction.predicted_crop
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
    isHealthy: prediction.isHealthy
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
    predicted_diseases: prediction.predicted_diseases
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
    confidence_percentage: prediction.confidence_percentage,
  };
};

const aiCropDignosis = asyncHandler(async (req, res) => {
  try {
    if (
      !req.files ||
      !req.files["cropimage"] ||
      req.files["cropimage"].length === 0
    ) {
      throw new ApiError(400, "No image file uploaded.");
    }

    const uploadedFile = req.files["cropimage"][0];

    const formData = new FormData();
    formData.append("file", fs.createReadStream(uploadedFile.path));

    let predictionResponse;
    try {
      predictionResponse = await axios.post(predictionUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
    } catch (error) {
      throw new ApiError(
        500,
        error.response?.data?.message ||
        "Failed to get a prediction from the AI backend."
      );
    }

    const cloudinaryResponse = await uploadOnCloudinary(
      uploadedFile.path,
      "crop_images"
    );

    if (!cloudinaryResponse?.secure_url) {
      throw new ApiError(500, "Failed to upload image to Cloudinary.");
    }

    const imageUrl = cloudinaryResponse.secure_url;
    const formatPrediction = formatPredictionResponse(predictionResponse.data);

    const diseaseKey = formatPrediction.predicted_diseases;
    const diseaseInfo = diseaseRecommendations[diseaseKey] || {};

    const cropImageData = new CropImage({
      userId: req.user._id,
      image: imageUrl,
      prediction: formatPrediction,
      recommendations: diseaseInfo,
    });

    await cropImageData.save();

    return res.json(
      new ApiResponse(200, {
        message: "Image uploaded and prediction retrieved successfully.",
        imageUrl,
        prediction: formatPrediction,
        recommendations: diseaseInfo,
      })
    );
  } catch (error) {
    console.error("Internal Server Error:", error);
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

const getDiagnosticHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cropImages = await CropImage.find({ userId });

  return res
    .status(200)
    .json
    (new
      ApiResponse(
        200,
        { cropImages }
      ));
});

const getDiagnosticHistoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Id is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ObjectId.");
  }

  try {
    const objectId = new mongoose.Types.ObjectId(id);
    const cropImage = await CropImage.findById(objectId);

    if (!cropImage) {
      throw new ApiError(404, "Crop image not found.");
    }

    return res.
      status(200).
      json(
        new ApiResponse(
          200,
          { cropImage }
        ));

  } catch (error) {
    console.error("Error during ObjectId conversion:", error);
  }
});

const deleteImage = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const userId = req.user._id;
  const cropImage = await CropImage.findOneAndDelete({ _id: id, userId });

  if (!cropImage) {
    throw new ApiError(404, "Crop image not found.");
  }
  return res.status(200).json(new ApiResponse(200, { message: "Image deleted successfully." }));


});

export { aiCropDignosis, getDiagnosticHistory, getDiagnosticHistoryById, deleteImage };
