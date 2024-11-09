import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./Middlewares/errorHandler.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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

app.options('/api/v1/users/login', cors());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/crop", cropRouter);

app.use(errorHandler);

export { app };
