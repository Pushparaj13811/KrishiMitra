import { Router } from "express";
import { getWeatherData } from "../Controllers/weather.controller.js";
const router = Router();

router.route("/get-weather-data").get(getWeatherData);

export default router;
