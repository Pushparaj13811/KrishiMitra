import { ApiResponse } from "../Utils/apiResponse.js";
import { ApiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Weather } from "../Models/weather.model.js";

export const getWeatherData = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const weatherData = await Weather.find({ location });
  if (!weatherData) {
    throw new ApiError("Weather data not found", 404);
  }
  return res.status(200).json(new ApiResponse(200, weatherData));
});
