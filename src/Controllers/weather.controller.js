import Redis from "ioredis";
import { ApiResponse } from "../Utils/apiResponse.js";
import { ApiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Weather } from "../Models/weather.model.js";

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisSubscriber = new Redis({
  host: redisHost,
  port: redisPort,
});
const connectedClients = [];

const sendWeatherUpdates = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ message: 'Connected to weather updates' })}\n\n`);

  connectedClients.push(res);

  req.on('close', () => {
    const index = connectedClients.indexOf(res);
    if (index !== -1) {
      connectedClients.splice(index, 1);
    }
  });
});

const publishWeatherUpdates = (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  connectedClients.forEach(client => client.write(message));
};

redisSubscriber.subscribe('weather_updates');

redisSubscriber.on('message', (channel, message) => {
  if (channel === 'weather_updates') {
    const weatherData = JSON.parse(message);
    publishWeatherUpdates(weatherData);
  }
});

const getWeatherData = asyncHandler(async (req, res) => {
  try {
    const location = req.query.location;
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
