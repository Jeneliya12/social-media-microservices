const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

async function invalidatePostCache(req, input) {

    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info("Create post endpoint hit");
    try {
        // Validate schema
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        });

        await newlyCreatedPost.save();
        await invalidatePostCache(req);
        logger.info("Post created successfully", newlyCreatedPost);
        res.status(201).json({
            success: true,
            message: "Post created successfully",
        });
    } catch (e) {
        logger.error("Error creating post:", e);
        res.status(500).json({
            success: false,
            message: "Error creating post",
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;

        // Check Redis for cached data
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
            logger.info(`Serving posts from cache for page ${page}`);
            return res.json(JSON.parse(cachedPosts));
        }

        // Fetch posts from MongoDB
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        // Count total posts
        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts,
        };

        // Save posts in Redis cache for 5 minutes (300 seconds)
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        logger.info(`Posts fetched from DB and cached for page ${page}`);

        res.json(result);
    } catch (e) {
        logger.error("Error fetching posts:", e);
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: e.message,
        });
    }
};

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);

        if (cachedPost) {
            logger.info(`Serving post from cache for post ID ${postId}`);
            return res.json(JSON.parse(cachedPost));
        }

        const singlePostDetailsById = await Post.findById(postId);

        if (!singlePostDetailsById) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailsById));

        res.json(singlePostDetailsById);
    } catch (e) {
        logger.error("Error fetching post:", e);
        res.status(500).json({
            success: false,
            message: "Error fetching post",
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id : req.params.id,
            user : req.user.userId
        })

        if(!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }

        await invalidatePostCache(req, req.params.id)
        res.json({
            message : "Post deleted successfully"
        })
    } catch (e) {
        logger.error("Error deleting post", error);
        res.status(500).json({
            success : false,
            message : "Error deleting post",
        })
    }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
