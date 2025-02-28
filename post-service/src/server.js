require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3002;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(()=> logger.info("Connected to mongodb"))
    .catch((e)=>logger.error("MongoConnection Error", e));

    const redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => console.log("Redis connected successfully"));
    redisClient.on("error", (err) => console.error("Redis connection error:", err));

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
});

//implement ip based rate limiting for sensitive endpoints

//routes => pass redisclient to routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient
    next();
}, postRoutes);

app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`Post service running on port ${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandlerd Rejection at", promise, "reason:", reason);
});