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
    alerts: {
      heatStress: {
        type: Map,
        of: String,
        default: {},
      },
      frost: {
        type: Map,
        of: String,
        default: {},
      },
      highHumidity: {
        type: Map,
        of: String,
        default: {},
      },
      lowHumidity: {
        type: Map,
        of: String,
        default: {},
      },
      windDamage: {
        type: Map,
        of: String,
        default: {},
      },
      drought: {
        type: Map,
        of: String,
        default: {},
      },
      flooding: {
        type: Map,
        of: String,
        default: {},
      },
      irrigation: {
        type: Map,
        of: String,
        default: {},
      },
      excessMoisture: {
        type: Map,
        of: String,
        default: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create index for automatic data expiration
WeatherSchema.index({ date: 1 }, { expireAfterSeconds: 345600 }); // 4 days (345600 seconds)

export const Weather = mongoose.model("Weather", WeatherSchema);
