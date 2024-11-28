import { Router } from "express";
import { getWeatherData, sendWeatherUpdates } from "../Controllers/weather.controller.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
const router = Router();

router.route("/").get(verifyJwt , getWeatherData);
router.route("/updates").get(verifyJwt,sendWeatherUpdates);

export default router;
