import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "20kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// routes

import userRouter from "./Routers/user.routes.js";
import articleRouter from "./Routers/article.routes.js";
import videoRouter from "./Routers/video.routes.js";
import cropRouter from "./Routers/crop.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/crop", cropRouter);

export { app };
