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
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => {
        logger.error("MongoDB Connection Error:", err);
        process.exit(1); 
    });

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => logger.info("Redis connected successfully"));
redisClient.on("error", (err) => {
    logger.error("Redis connection error:", err);
    process.exit(1); 
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// Routes => Pass redisClient to routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);

// Error Handling Middleware
app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at:`, promise, "Reason:", reason);
});

// Start the Server
app.listen(PORT, () => {
    logger.info(`Post service running on port ${PORT}`);
});
