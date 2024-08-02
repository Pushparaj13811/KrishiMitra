import { ApiError } from "../Utils/apiError.js";
import { ApiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Crop } from "../Models/crops.model.js";
import { CropImage } from "../Models/cropImages.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../Utils/cloudinary.js";
import fs from "fs";

const uploadCropData = asyncHandler(async (req, res) => {
  // check if the user is authenticated
  // Verify that req.user?._id exists
  // Get the crop metadata from the request body
  // Extract crop metadata fields from req.body (name, scientificName, description, costPerAcre, requiredSoilType, diseasesRisk)
  // Get the crop images from the request files
  // Retrieve the images from req.files
  // check if the crop metadata is provided
  // Ensure all metadata fields are present and not empty
  // check if the crop images are provided
  // Ensure req.files is not empty and contains at least 3 images
  // check if the crop images are not empty
  // Ensure that req.files.length is greater than 2
  // check if the crop images are of type image
  // Validate each file in req.files to ensure it is an image
  // check if the metadata is valid and sanitize the input fields
  // Metadata is validated by checking if fields are neither undefined, null, nor empty
  // upload the crop metadata
  // Create a new crop entry in the database using the metadata
  // get the crop id from the uploaded crop metadata
  // Retrieve the cropId from the created crop entry
  // upload the crop images on Cloudinary
  // Upload images to Cloudinary and collect their URLs
  // Track if any upload fails
  // check if the crop images are uploaded successfully
  // If any upload fails, handle cleanup:
  //   - Delete uploaded images from Cloudinary
  //   - Remove the crop metadata from the database
  //   - Unlink any local files that were uploaded
  // create a new crop image document in the database
  // Insert records for successfully uploaded images into the CropImage collection
  // send the response
  // Respond with a success message containing crop metadata and image URLs, or handle any errors

  const user = req.user?._id;

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const {
    name,
    scientificName,
    description,
    costPerAcre,
    requiredSoilType,
    diseasesRisk,
  } = req.body;

  if (
    [
      name,
      scientificName,
      description,
      costPerAcre,
      requiredSoilType,
      diseasesRisk,
    ].includes(undefined || null || "")
  ) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  const images = req.files;

  if (!images || images.length <= 2) {
    throw new ApiError(400, "Please provide at least 3 crop image");
  }

  for (let image of images) {
    if (!image.mimetype.startsWith("image")) {
      throw new ApiError(400, "All files must be valid images");
    }
  }

  const crop = await Crop.create({
    cropName: name,
    scientificName,
    description,
    costPerAcres: costPerAcre,
    requiredSoilType,
    diseasesRisk,
  });

  const cropId = crop._id;

  const localImagePaths = images.map((image) => image.path);
  const imageUrls = [];
  let uploadFailed = false;

  for (let localPath of localImagePaths) {
    try {
      let url = await uploadOnCloudinary(localPath, "image");
      if (url) {
        imageUrls.push(url);
      } else {
        uploadFailed = true;
        fs.unlinkSync(localPath);
      }
    } catch (error) {
      uploadFailed = true;
      fs.unlinkSync(localPath);
    }
  }

  if (uploadFailed) {
    for (let url of imageUrls) {
      await deleteFromCloudinary(url);
    }
    await Crop.findByIdAndDelete(cropId);
    throw new ApiError(500, "Failed to upload some crop images");
  }

  const cropImages = await CropImage.insertMany(
    imageUrls.map((url) => ({ cropId, image: url }))
  );

  if (!cropImages) {
    for (const url of imageUrls) {
      await deleteFromCloudinary(url);
    }
    await Crop.findByIdAndDelete(cropId);
    throw new ApiError(500, "Failed to save crop images");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { crop, cropImages },
        "Crop data and images uploaded successfully"
      )
    );
});

const deleteCropData = asyncHandler(async (req, res) => {
  // Get the crop id from the request params
  // Check if the crop id is provided, throw an error if not
  // Get the user id from the request object
  // Check if the user id is available, throw an error if not
  // Use an aggregation pipeline to:
  //   - Match the crop document by id and user id
  //   - Lookup related crop images
  //   - Unwind the images array while preserving null and empty arrays
  //   - Group the results to get the crop document and related images
  // Check if the result is empty, throw an error if the crop is not found or access is unauthorized
  // Extract the crop document and crop images from the result
  // Delete the crop document from the database
  // If there are crop images, delete them from Cloudinary
  //   - Use Promise.all to handle multiple deletions concurrently
  //   - Log any errors encountered during image deletion
  // Delete the crop images from the database
  // Send a success response with the deleted crop data
  // Handle and log any errors that occur during the process

  const cropId = req.params?.id;

  if (!cropId) {
    throw new ApiError(400, "Crop ID is required");
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const result = await Crop.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(cropId),
          uploadedby: userId,
        },
      },
      {
        $lookup: {
          from: "cropimages",
          localField: "_id",
          foreignField: "cropId",
          as: "images",
        },
      },
      { $unwind: { path: "$images", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          crop: { $first: "$$ROOT" },
          images: { $push: "$images" },
        },
      },
    ]);

    if (!result.length) {
      throw new ApiError(404, "Crop not found or unauthorized access");
    }

    const crop = result[0].crop;
    const cropImages = result[0].images;

    await Crop.deleteOne({ _id: cropId });

    if (cropImages.length > 0) {
      await Promise.all(
        cropImages.map(async (image) => {
          try {
            await deleteFromCloudinary(image.image);
          } catch (error) {
            console.error(
              `Failed to delete image ${image.image} from Cloudinary`,
              error
            );
          }
        })
      );
      await CropImage.deleteMany({ cropId });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, crop, "Crop data and images deleted successfully")
      );
  } catch (error) {
    console.error("Error during crop deletion", error);
    throw new ApiError(500, "Failed to delete crop data");
  }
});

const getCropData = asyncHandler(async (req, res) => {
  // Get the crop id from the request params
  // Check if the crop id is provided, throw an error if not
  // Use an aggregation pipeline to:
  //   - Match the crop document by id
  //   - Lookup related crop images
  //   - Lookup the user who uploaded the crop
  //   - Unwind the uploader array while preserving null and empty arrays
  //   - Project the fields to include/exclude in the final result
  // Check if the result is empty, throw an error if the crop is not found
  // Extract the crop document and crop images from the result
  // Send a success response with the crop data
  // Handle and log any errors that occur during the process

  const cropId = req.params?.id;
  if (!cropId) {
    throw new ApiError(400, "Crop ID is required");
  }

  try {
    const [result] = await Crop.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(cropId),
        },
      },
      {
        $lookup: {
          from: "cropimages",
          localField: "_id",
          foreignField: "cropId",
          as: "images",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedby",
          foreignField: "_id",
          as: "uploader",
        },
      },
      {
        $unwind: {
          path: "$uploader",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          cropName: 1,
          scientificName: 1,
          description: 1,
          costPerAcres: 1,
          requiredSoilType: 1,
          diseasesRisk: 1,
          images: 1,
          uploader: {
            _id: "$uploader._id",
            name: "$uploader.name",
          },
        },
      },
    ]);

    if (!result) {
      throw new ApiError(404, "Crop not found");
    }

    const {
      cropName,
      scientificName,
      description,
      costPerAcres,
      requiredSoilType,
      diseasesRisk,
      images,
      uploader,
    } = result;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          crop: {
            cropName,
            scientificName,
            description,
            costPerAcres,
            requiredSoilType,
            diseasesRisk,
          },
          cropImages: images,
          uploader,
        },
        "Crop data retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error during crop retrieval", error);
    throw new ApiError(500, "Failed to retrieve crop data");
  }
});

const getAllCrops = asyncHandler(async (req, res) => {
  // Get the page number and page size from the request query parameters
  // Set default values for page number and page size if not provided
  // Validate the page number and page size
  // Use the find method with pagination to:
  //   - Retrieve crops with pagination using skip and limit
  //   - Optionally include related data such as crop images or user who uploaded
  //   - Optionally sort the results by a specific field (e.g., name, date)
  // Count the total number of crop documents for pagination info
  // Create pagination metadata (e.g., total pages, current page)
  // Send a success response with the list of crops and pagination metadata
  // Handle and log any errors that occur during the process
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  if (page < 1 || limit < 1) {
    throw new ApiError(400, "Page and limit must be positive integers");
  }

  try {
    const crops = await Crop.aggregate([
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "cropimages",
          localField: "_id",
          foreignField: "cropId",
          as: "images",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedby",
          foreignField: "_id",
          as: "uploader",
        },
      },
      {
        $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          cropName: 1,
          scientificName: 1,
          description: 1,
          costPerAcres: 1,
          requiredSoilType: 1,
          diseasesRisk: 1,
          images: 1,
          uploader: {
            _id: "$uploader._id",
            name: "$uploader.name",
          },
        },
      },
    ]);

    const totalCrops = await Crop.countDocuments();

    const totalPages = Math.ceil(totalCrops / limit);

    return res.status(200).json({
      crops,
      pagination: {
        totalCrops,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
      message: "Crops retrieved successfully",
    });
  } catch (error) {
    console.error("Error during crop retrieval", error);
    throw new ApiError(500, "Failed to retrieve crops");
  }
});

const updateCropData = asyncHandler(async (req, res) => {
  // Get the crop ID from the request parameters
  // Get the user ID from the request object
  // Check if crop ID is provided, throw an error if not
  // Check if user ID is available, throw an error if not
  // Extract updated crop metadata from the request body
  // Validate that all required fields are provided, throw an error if any field is missing
  // Use `findOneAndUpdate` to:
  //   - Match the crop document by ID and user ID
  //   - Update the crop document with new metadata
  //   - Return the updated crop document
  // Check if the crop was found and updated, throw an error if not
  // Fetch related crop images using `find` method
  // Send a success response with updated crop data and related images
  // Log any errors that occur during the update process
  // Throw a general error indicating failure to update crop data

  const cropId = req.params?.id;
  const userId = req.user?._id;

  if (!cropId) {
    throw new ApiError(400, "Crop ID is required");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const {
    name,
    scientificName,
    description,
    costPerAcre,
    requiredSoilType,
    diseasesRisk,
  } = req.body;

  if (
    !name ||
    !scientificName ||
    !description ||
    !costPerAcre ||
    !requiredSoilType ||
    !diseasesRisk
  ) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  try {
    const crop = await Crop.findOneAndUpdate(
      {
        _id: cropId,
        uploadedby: userId,
      },
      {
        $set: {
          cropName: name,
          scientificName,
          description,
          costPerAcres: costPerAcre,
          requiredSoilType,
          diseasesRisk,
        },
      },
      { new: true }
    ).exec();

    if (!crop) {
      throw new ApiError(404, "Crop not found or unauthorized access");
    }

    const cropImages = await CropImage.find({ cropId }).exec();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { crop, cropImages },
          "Crop data updated successfully"
        )
      );
  } catch (error) {
    console.error("Error during crop update", error);
    throw new ApiError(500, "Failed to update crop data");
  }
});

const addCropImages = asyncHandler(async (req, res) => {
  // Get the crop ID from the request parameters
  // Get the user ID from the request object
  // Check if crop ID is provided, throw an error if not
  // Check if user ID is available, throw an error if not
  // Get the crop images from the request files
  // Check if crop images are provided, throw an error if not
  // Ensure at least 3 images are provided
  // Validate that each file is an image
  // Fetch the crop document using `findOne` method
  // Check if the crop document exists, throw an error if not
  // Check if the user is the owner of the crop, throw an error if not
  // Get the local paths of the uploaded images
  // Upload each image to Cloudinary and track URLs
  // Handle any errors during upload and delete local files if upload fails
  // Insert records for the new images into the CropImage collection
  // Send a success response with updated crop images
  // Handle and log any errors that occur during the process
  const cropId = req.params?.id;
  const userId = req.user?._id;

  if (!cropId) {
    throw new ApiError(400, "Crop ID is required");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const images = req.files;

  if (!images || images.length === 0) {
    throw new ApiError(400, "Please provide at least one crop images");
  }

  images.forEach((image) => {
    if (!image.mimetype.startsWith("image")) {
      throw new ApiError(400, "All files must be valid images");
    }
  });

  const crop = await Crop.findOne({ _id: cropId, uploadedby: userId }).exec();

  if (!crop) {
    throw new ApiError(404, "Crop not found or unauthorized access");
  }

  const localImagePaths = images.map((image) => image.path);
  const imageUrls = [];
  const uploadPromises = localImagePaths.map(async (localPath) => {
    try {
      const url = await uploadOnCloudinary(localPath, "image");
      if (url) {
        imageUrls.push(url);
        fs.unlinkSync(localPath);
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      fs.unlinkSync(localPath);
      console.error("Upload failed for", localPath, error);
      return Promise.reject(new ApiError(500, "Failed to upload some images"));
    }
  });

  try {
    await Promise.all(uploadPromises);
  } catch (error) {
    throw new ApiError(500, "Error processing image uploads");
  }

  try {
    await CropImage.insertMany(
      imageUrls.map((url) => ({ cropId, image: url }))
    );
  } catch (error) {
    throw new ApiError(500, "Failed to update crop images in database");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { message: "Crop images updated successfully" })
    );
});

const deleteCropImages = asyncHandler(async (req, res) => {
  // Get the image ID from the request parameters
  // Get the user ID from the request object
  // Check if the image ID is provided; throw an error if not
  // Check if the user ID is available; throw an error if not
  // Fetch the crop image and related crop document in a single aggregation pipeline
  // - Match the crop image document by image ID
  // - Lookup the related crop document using crop ID
  // - Unwind the crop document array to get a single document
  // - Match the crop document to ensure the user is the owner
  // Check if the result is empty; throw an error if the image or crop is not found or access is unauthorized
  // Extract the image URL from the result
  // Attempt to delete the image from Cloudinary
  // Log any errors that occur during the Cloudinary deletion
  // Delete the crop image record from the database
  // Send a success response indicating that the image was deleted successfully
  // Log any errors that occur during the process
  // Throw a general error indicating failure to delete the image

  const imageId = req.params?.id;
  const userId = req.user?._id;

  if (!imageId) {
    throw new ApiError(400, "Image ID is required");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const [result] = await CropImage.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(imageId) },
      },
      {
        $lookup: {
          from: "crops",
          localField: "cropId",
          foreignField: "_id",
          as: "crop",
        },
      },
      { $unwind: "$crop" },
      {
        $match: { "crop.uploadedby": userId },
      },
    ]);

    if (!result) {
      throw new ApiError(404, "Image or crop not found or unauthorized access");
    }

    const { image } = result;

    try {
      await deleteFromCloudinary(image);
    } catch (error) {
      console.error(`Failed to delete image ${image} from Cloudinary`, error);
    }

    await CropImage.deleteOne({ _id: imageId });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Image deleted successfully"));
  } catch (error) {
    console.error("Error during image deletion", error);
    throw new ApiError(500, "Failed to delete image");
  }
});

export {
  uploadCropData,
  deleteCropData,
  getCropData,
  getAllCrops,
  updateCropData,
  addCropImages,
  deleteCropImages,
};
