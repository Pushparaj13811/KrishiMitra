import Redis from "ioredis";
import { ApiResponse } from "../Utils/apiResponse.js";
import { ApiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Weather } from "../Models/weather.model.js";
import { UserProfile } from "../Models/userProfile.model.js";
import { User } from "../Models/users.model.js";

const redisUrl = process.env.REDIS_URL;
let redisSubscriber;

if (redisUrl) {
  redisSubscriber = new Redis(redisUrl);
} else {
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = process.env.REDIS_PORT || 6379;

  redisSubscriber = new Redis({
    host: redisHost,
    port: redisPort,
  });
}

const connectedClients = [];

const sendWeatherUpdates = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { location } = await UserProfile.findOne({ userId }).select("location");
  if (!location) {
    return res.status(404).json({ success: false, message: "Location not found for the user" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ message: "Connected to weather updates for your location" })}\n\n`);


  connectedClients.push({ res, location });


  req.on("close", () => {
    const index = connectedClients.findIndex(client => client.res === res);
    if (index !== -1) {
      connectedClients.splice(index, 1);
    }
  });
});

const publishWeatherUpdates = (weatherData) => {
  connectedClients.forEach(({ res, location }) => {
    if (weatherData.location === location) {
      const message = `data: ${JSON.stringify(weatherData)}\n\n`;
      res.write(message);
    }
  });
};

redisSubscriber.subscribe("weather_updates");

redisSubscriber.on("message", (channel, message) => {
  if (channel === "weather_updates") {
    const weatherData = JSON.parse(message);
    publishWeatherUpdates(weatherData);
  }
});


const getWeatherData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { location } = await UserProfile.findOne({ userId: userId }).select("location");
    if (!location) {
      throw new ApiError(400, "Location is required");
    }

    const weatherData = await Weather.find({ location }).sort({ date: -1 }).limit(10);

    return res.status(200).json(new ApiResponse(200, weatherData, "Weather data fetched successfully"));

  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
  }
});

export { getWeatherData, sendWeatherUpdates };
