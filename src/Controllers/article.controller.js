import { ApiError } from "../Utils/apiError.js";
import { ApiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Article } from "../Models/articles.model.js";

const createArticle = asyncHandler(async (req, res) => {
  const { title, content, tags, language } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  if (!title || !content || !tags || !language) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const article = await Article.create({
      title,
      content,
      tags,
      language,
      authorId: userId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, article, "Article created successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
});

const getAllArticles = asyncHandler(async (req, res) => {
  // Get the page number and page size from the request query parameters
  // Set default values for page number and page size if not provided
  // Validate the page number and page size
  //   - Retrieve articles with pagination using skip and limit
  //   - Optionally include related data such as author details
  //   - Optionally sort the results by a specific field (e.g., name, date)
  // Count the total number of article documents for pagination info
  // Create pagination metadata (e.g., total pages, current page)
  // Send a success response with the list of article and pagination metadata
  // Handle and log any errors that occur during the process

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1 || limit < 1) {
    throw new ApiError(400, "Invalid page or limit value");
  }

  const skip = (page - 1) * limit;

  try {
    const articles = await Article.aggregate([
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          tags: 1,
          language: 1,
          author: {
            _id: "$author._id",
            name: "$author.name",
            email: "$author.email",
          },
        },
      },
    ]);

    const totalArticles = await Article.countDocuments();

    const totalPages = Math.ceil(totalArticles / limit);

    const pagination = {
      totalArticles,
      totalPages,
      currentPage: page,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { articles, pagination },
          "Articles retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
});

const getArticleById = asyncHandler(async (req, res) => {
  // Get the article id from the request params
  // Check if the article id is provided, throw an error if not
  // Use an aggregation pipeline to:
  //   - Match the article document by id
  //   - Lookup the user who is the author article
  //   - Unwind the author array while preserving null and empty arrays
  //   - Project the fields to include/exclude in the final result
  // Check if the result is empty, throw an error if the article is not found
  // Send a success response with the article data
  // Handle and log any errors that occur during the process
  const articleId = req.params?.id;

  if (!articleId) {
    throw new ApiError(400, "Invalid article ID");
  }

  try {
    const article = await Article.aggregate([
      {
        $match: {
          _id: articleId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: { path: "$author", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          tags: 1,
          language: 1,
          author: {
            _id: "$author._id",
            name: "$author.name",
            email: "$author.email",
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, article, "Article retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
});

export { createArticle, getAllArticles, getArticleById };
