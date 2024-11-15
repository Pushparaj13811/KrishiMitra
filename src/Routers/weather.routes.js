import { Router } from "express";
import { getWeatherData, sendWeatherUpdates } from "../Controllers/weather.controller.js";
const router = Router();

router.route("/").get(getWeatherData);
router.route("/updates").get(sendWeatherUpdates);

export default router;
