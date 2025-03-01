const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

const createPost = async(req,res) => {
    logger.info("Create post endpoint hit")
    try{
        //validate teh schema
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const {content,  mediaIds} = req.body;
        const newlyCreatedPost = new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || [],
        });

        await newlyCreatedPost.save();
        logger.info("Post created successfully", newlyCreatedPost);
        res.status(201).json({
            success : true,
            message  : "Post create successfully"
        })
    }catch(e){
        logger.error("Error creating post", error)
        res.status(500).json({
            success : false,
            message : "Error creating post",
        })
    }
}

const getAllPosts = async(req,res) => {
    try{
        const page = parseInt(req.query) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey)

        if(cachedPosts) {
            return res.json(json.PARSE(cachedPosts))
        }
        const posts = await Post.find({}).sort({createdAt : -1}).skip(startIndex).limit(limit)

        const totalNoOfPosts = await Post.countDocuments()

        const result = {
            posts,
            currentpage : page,
            totalPages : Math.ceil(totalNoOfPosts/limit),
            totalPosts : totalNoOfPosts
        }

        //save your posts in redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

        res.json(result)
    }catch(e){
        logger.error("Error fetching post", error)
        res.staus(500).json({
            success : false,
            message : "Error fetching post",
        })
    }
}

const getPost = async(req,res) => {
    try{

    }catch(e){
        logger.error("Error fetching post", error)
        res.staus(500).json({
            success : false,
            message : "Error fetching post",
        })
    }
}

const deletePost = async(req,res) => {
    try{

    }catch(e){
        logger.error("Error deleting post", error)
        res.staus(500).json({
            success : false,
            message : "Error deleting post",
        })
    }
}

module.exports = {createPost, getAllPosts };