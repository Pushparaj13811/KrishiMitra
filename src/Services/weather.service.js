import Redis from "ioredis";
import axios from "axios";
import cron from "node-cron";
import { ApiError } from "../Utils/apiError.js";
import { Weather } from "../Models/weather.model.js";
import { UserProfile } from "../Models/userProfile.model.js";

const redisPublisher = new Redis({
  host: "localhost",
  port: 6379
});
const getCropTypes = async () => {
  try {
    const cropTypes = await UserProfile.find({
      primaryCrops: { $ne: null },
    }).select("primaryCrops");
    const primaryCropList = cropTypes.map((profile) => profile.primaryCrops);

    const uniqueCropTypes = [...new Set(primaryCropList.flat())];

    return uniqueCropTypes;
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

const fetchWeatherData = async (location) => {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPEN_WEATHER_API_KEY}`
  );
  return response.data;
};

// Generate detailed alerts based on weather data and crop types
const processWeatherData = async (trends, cropTypes) => {
  const alerts = {
    heatStress: "",
    frost: "",
    highHumidity: "",
    lowHumidity: "",
    windDamage: "",
    drought: "",
    flooding: "",
    irrigation: {},
    excessMoisture: {},
  };

  const cropConditions = {
    Wheat: {
      maxTemperature: 35,
      minTemperature: -5,
      maxHumidity: 80,
      minHumidity: 40,
      maxWindSpeed: 20,
      minRainfall: 10,
      maxRainfall: 50,
    },
    Maiz: {
      maxTemperature: 35,
      minTemperature: -5,
      maxHumidity: 80,
      minHumidity: 40,
      maxWindSpeed: 20,
      minRainfall: 10,
      maxRainfall: 50,
    },
    Paddy: {
      maxTemperature: 30,
      minTemperature: 10,
      maxHumidity: 90,
      minHumidity: 50,
      maxWindSpeed: 15,
      minRainfall: 5,
      maxRainfall: 100,
    },
    Barley: {
      maxTemperature: 32,
      minTemperature: 15,
      maxHumidity: 85,
      minHumidity: 45,
      maxWindSpeed: 25,
      minRainfall: 20,
      maxRainfall: 70,
    },
  };

  cropTypes.forEach((crop) => {
    const cropAlert = {};
    const conditions = cropConditions[crop];

    if (trends.temperature[0] > conditions.maxTemperature) {
      cropAlert.heatStress = `${crop} - Heat stress warning: Temperature exceeds maximum threshold of ${conditions.maxTemperature}°C.`;
    }

    if (trends.temperature[0] < conditions.minTemperature) {
      cropAlert.frost = `${crop} - Frost warning: Temperature drops below minimum threshold of ${conditions.minTemperature}°C.`;
    }

    if (trends.humidity[0] > conditions.maxHumidity) {
      cropAlert.highHumidity = `${crop} - High humidity warning: Humidity exceeds maximum threshold of ${conditions.maxHumidity}%.`;
    }

    if (trends.humidity[0] < conditions.minHumidity) {
      cropAlert.lowHumidity = `${crop} - Low humidity warning: Humidity drops below minimum threshold of ${conditions.minHumidity}%.`;
    }

    if (trends.windSpeed[0] > conditions.maxWindSpeed) {
      cropAlert.windDamage = `${crop} - Wind damage risk: Wind speed exceeds maximum threshold of ${conditions.maxWindSpeed} km/h.`;
    }

    if (trends.rainfall[0] < conditions.minRainfall) {
      cropAlert.drought = `${crop} - Drought warning: Insufficient rainfall below minimum threshold of ${conditions.minRainfall} mm.`;
      cropAlert.irrigation = `${crop} - Irrigation needed to prevent crop stress.`;
    }

    if (trends.rainfall[0] > conditions.maxRainfall) {
      cropAlert.flooding = `${crop} - Flooding risk: Rainfall exceeds maximum threshold of ${conditions.maxRainfall} mm.`;
      cropAlert.excessMoisture = `${crop} - Excess moisture alert: Risk of waterlogging and root damage.`;
    }

    alerts.irrigation[crop] = cropAlert.irrigation || "";
    alerts.excessMoisture[crop] = cropAlert.excessMoisture || "";
    if (cropAlert.heatStress) alerts.heatStress += `\n${cropAlert.heatStress}`;
    if (cropAlert.frost) alerts.frost += `\n${cropAlert.frost}`;
    if (cropAlert.highHumidity)
      alerts.highHumidity += `\n${cropAlert.highHumidity}`;
    if (cropAlert.lowHumidity)
      alerts.lowHumidity += `\n${cropAlert.lowHumidity}`;
    if (cropAlert.windDamage) alerts.windDamage += `\n${cropAlert.windDamage}`;
    if (cropAlert.drought) alerts.drought += `\n${cropAlert.drought}`;
    if (cropAlert.flooding) alerts.flooding += `\n${cropAlert.flooding}`;
  });

  return alerts;
};

const extractCropTypes = async (alerts) => {
  const cropTypes = new Set();
  Object.values(alerts).forEach((alertData) => {
    if (typeof alertData === "string" && alertData.trim() !== "") {
      const alertLines = alertData
        .split("\n")
        .filter((line) => line.trim() !== "");

      alertLines.forEach((line) => {
        const match = line.match(/^([A-Za-z]+)/);
        if (match && match[1]) {
          cropTypes.add(match[1]);
        }
      });
    }
  });

  return Array.from(cropTypes);
};

const transformAlerts = (alerts, crops) => {
  const transformedAlerts = {};

  for (const [alertType, alertData] of Object.entries(alerts)) {
    if (typeof alertData === "string" && alertData !== "") {
      const cropAlerts = {};

      const alertLines = alertData
        .split("\n")
        .filter((line) => line.trim() !== "");

      alertLines.forEach((line) => {
        crops.forEach((crop) => {
          if (line.includes(crop)) {
            cropAlerts[crop] = line;
          }
        });
      });
      transformedAlerts[alertType] = cropAlerts;
    } else if (typeof alertData === "object") {
      transformedAlerts[alertType] = alertData;
    } else {
      transformedAlerts[alertType] = {};
    }
  }

  return transformedAlerts;
};
const locations = async () => {
  try {
    const locations = await UserProfile.find({
      location: { $ne: null },
    }).select("location");
    const locationList = locations.map((profile) => profile.location);
    const uniqueLocations = [...new Set(locationList)];
    return uniqueLocations;
  } catch (error) {
    throw new ApiError(500, error?.message || "Error fetching locations");
  }
};

const startWeatherCronJob = () => {
  console.log("Weather controller :: startWeatherCronJob :: starting cron job");
  cron.schedule("* * * * *", async () => {
    try {
      const data = await locations();

      for (const location of data) {
        try {
          const fetchedData = await fetchWeatherData(location);
          if (!fetchedData) {
            console.error(`No weather data fetched for location: ${location}`);
            continue;
          }

          const existingData = await Weather.find({
            location,
            date: { $gte: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          }).sort({ date: -1 });

          const mergedData = mergeWeatherData(existingData, fetchedData);

          if (!mergedData || !Array.isArray(mergedData)) {
            console.error(`Invalid merged data for location: ${location}`);
            continue;
          }

          const trends = {
            temperature: mergedData
              .map((data) => data.temperature)
              .filter(Boolean),
            humidity: mergedData.map((data) => data.humidity).filter(Boolean),
            windSpeed: mergedData.map((data) => data.windSpeed).filter(Boolean),
            rainfall: mergedData.map((data) => data.rainfall).filter(Boolean),
          };

          const cropTypes = await getCropTypes();
          const alerts = await processWeatherData(trends, cropTypes);
          const crops = await extractCropTypes(alerts);
          const transformedAlerts = transformAlerts(alerts, crops);

          await storeWeatherDataInDB(
            mergedData,
            location,
            transformedAlerts
          );

          redisPublisher.publish('weather_updates', JSON.stringify({ location, mergedData, alerts: transformedAlerts }));
        } catch (error) {
          throw new ApiError(500, error?.message || "Error processing weather data");
        }
      }
    } catch (error) {
      console.error("Cron job failed:", error);
    }
  });
};

const mergeWeatherData = (existingData, fetchedData) => {
  if (!Array.isArray(existingData) || !fetchedData) {
    console.error("Invalid input data for merging");
    return [];
  }

  try {
    const newDataPoint = {
      location: fetchedData.name,
      date: new Date(fetchedData.dt * 1000),
      temperature: fetchedData.main?.temp,
      humidity: fetchedData.main?.humidity,
      windSpeed: fetchedData.wind?.speed,
      rainfall: fetchedData.rain?.["1h"] || 0,
      pressure: fetchedData.main?.pressure,
      perception: fetchedData.weather?.[0]?.description,
      uvIndex: fetchedData.uvi,
      visibility: fetchedData.visibility,
      sunrise: fetchedData.sys?.sunrise,
      sunset: fetchedData.sys?.sunset,
      cloudCover: fetchedData.clouds?.all,
      feelsLike: fetchedData.main?.feels_like,
      windDirection: fetchedData.wind?.deg,
    };

    // Validate the new data point
    if (!newDataPoint.date || !newDataPoint.location) {
      throw new Error("Invalid weather data point");
    }

    const mergedArray = [...existingData, newDataPoint];
    return mergedArray.slice(-4); // Keep only the last 4 entries
  } catch (error) {
    throw new ApiError(500, error?.message || "Error merging weather data");
    return [];
  }
};

const storeWeatherDataInDB = async (mergedData, location, alerts) => {
  if (!location || !alerts || !Array.isArray(mergedData)) {
    throw new ApiError(400, "Invalid input data for storage");
  }

  try {
    const storedData = [];
    for (const data of mergedData) {
      if (!data || typeof data !== "object") {
        console.warn(`Skipping invalid data point for location ${location}`);
        continue;
      }

      const weatherData = {
        location,
        temperature: data.temperature,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        rainfall: data.rainfall,
        pressure: data.pressure,
        perception: data.perception,
        uvIndex: data.uvIndex,
        visibility: data.visibility,
        sunrise: data.sunrise,
        sunset: data.sunset,
        cloudCover: data.cloudCover,
        feelsLike: data.feelsLike,
        windDirection: data.windDirection,
        alerts,
        date: data.date,
      };

      // Validate required fields
      if (!weatherData.date) {
        console.warn(
          `Skipping data point without date for location ${location}`
        );
        continue;
      }

      const updatedData = await Weather.findOneAndUpdate(
        { location, date: data.date },
        weatherData,
        { upsert: true, new: true }
      );


      storedData.push(updatedData);
    }

    if (storedData.length === 0) {
      throw new ApiError(400, "No valid data points to store");
    }
    return storedData;
  } catch (error) {
    throw new ApiError(500, error?.message || "Error storing weather data");
  }
};

// const storeWeatherData = asyncHandler(async () => {
//   // Call the cron job when storeWeatherData is invoked
//   const response = startWeatherCronJob();

//   return new ApiResponse(
//     200,
//     response,
//     "Weather data and alerts stored or updated in DB successfully"
//   );
// });

// await storeWeatherData();

export { startWeatherCronJob };