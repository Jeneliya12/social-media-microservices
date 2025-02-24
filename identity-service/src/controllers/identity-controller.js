const User = require("../models/User");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const generateTokens = require("../utils/generateTokens");

const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, password, username } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.info(`User saved successfully: ${user._id}`);

        const tokens = await generateTokens(user);

        return res.status(201).json({
            success: true,
            message: "User registered successfully!",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (e) {
        logger.error("Registration error occurred", e);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("Invalid user");
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn("Invalid password");
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            success: true,
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (e) {
        logger.error("Login error occurred", e);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { registerUser, loginUser };
