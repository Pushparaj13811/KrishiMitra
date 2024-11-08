import { ApiError } from "../Utils/apiError.js";

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statuscode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }

  // For unhandled errors, send a generic response
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
    data: null,
  });
};

export default errorHandler;
