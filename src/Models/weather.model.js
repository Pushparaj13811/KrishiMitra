import mongoose, { Schema } from "mongoose";

const WeatherSchema = new Schema(
  {
    location: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    windSpeed: {
      type: Number,
      required: true,
    },
    rainfall: {
      type: Number,
      required: true,
    },
    pressure: {
      type: Number,
      required: true,
    },
    perception: {
      type: String,
      required: true,
    },
    uvIndex: {
      type: Number,
      required: true,
    },
    visibility: {
      type: Number,
      required: true,
    },
    sunrise: {
      type: Date,
    },
    sunset: {
      type: Date,
    },
    feelsLike: {
      type: Number,
      required: true,
    },
    windDirection: {
      type: Number,
    },
    dewPoint: {
      type: Number,
    },
    airQuality: {
      type: Number,
    },
    cloudCover: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

WeatherSchema.index({ date: 1 }, { expireAfterSeconds: 345600 });

export const Weather = mongoose.model("Weather", WeatherSchema);
