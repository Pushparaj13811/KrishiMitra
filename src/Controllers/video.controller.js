import { ApiResponse } from "../Utils/apiResponse.js";
import { ApiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../Utils/cloudinary.js";
import { Video } from "../Models/videos.model.js";
import getVideoDuration from "../Utils/duration.js";

const uploadVideo = asyncHandler(async (req, res) => {
  // Get the title, description, language from the request body
  // Valid and sanitize the input fields
  // Get the user id from the request object
  // Check if the user is authenticated
  // Check if the required fields are provided
  // Get the video file path from the request object
  // Check if the video file path is provided
  // Upload the video file on cloudinary
  // Check if the video file is uploaded successfully
  // Create a new video document in the database
  // Send the response

  const { title, description, language } = req.body;

  if ([title, description, language].includes(undefined || null || "")) {
    throw new ApiError(400, "Please provide all the required fields");
  }
  const uploadedby = req.user?._id;
  if (!uploadedby) {
    throw new ApiError(400, "Unauthorized request");
  }

  const localVideoPath = req.file?.path;

  if (!localVideoPath) {
    throw new ApiError(400, "Video file is missing");
  }

  const videoDuration = await getVideoDuration(localVideoPath);

  const videoPath = await uploadOnCloudinary(localVideoPath, "video");

  if (!videoPath) {
    throw new ApiError(500, "Failed to upload video");
  }

  const video = await Video.create({
    title,
    description,
    language,
    url: videoPath,
    duration: videoDuration,
    uploadedby,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  // Get the video id from the request params
  // Get the user id from the request object
  // Get the video document from the database
  // Check if the video document exists
  // Check if the user is the owner of the video
  // Delete the video document from the database
  // Delete the video file from cloudinary
  // Send the response

  const videoId = req.params?.id;

  if (!videoId) {
    throw new ApiError(400, "Unable to get video id");
  }
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  const video = await Video.findOneAndDelete({
    _id: videoId,
    uploadedby: userId,
  });

  if (!video) {
    throw new ApiError(404, "Unauthorized request or video not found");
  }

  const videoCloudinaryId = video.url.split("/").pop().split(".")[0];

  await deleteFromCloudinary(videoCloudinaryId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  // Get the page and limit from the query params
  // Get the videos from the database
  // Check if the videos exist
  // Send the response

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json(
        new ApiResponse(400, null, "Page and limit must be positive integers")
      );
  }

  const videos = await Video.aggregate([
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "uploadedby",
        foreignField: "_id",
        as: "uploader",
      },
    },
    { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        language: 1,
        url: 1,
        uploader: {
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);

  if (videos.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos retrieved successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // Get the video id from the request params
  // Get the video from the database
  // Check if the video exists
  // Send the response

  const videoId = req.params?.id;

  if (!videoId) {
    throw new ApiError(400, "Unable to get video id");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "Users",
        localField: "uploadedby",
        foreignField: "_id",
        as: "uploadedby",
      },
    },
    {
      $unwind: "$uploadedby",
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        url: 1,
        language: 1,
        uploadedby: {
          username: { $arrayElemAt: [$uploadedby.username, 0] },
          avatar: { $arrayElemAt: [$uploadedby.avatar, 0] },
        },
      },
    },
  ]);

  if (video.length === 0) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video retrieved successfully"));
});

export { uploadVideo, deleteVideo, getAllVideos, getVideoById };
