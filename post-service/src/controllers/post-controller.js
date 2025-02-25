const logger = require("../utils/logger");

const createPost = async(req,res) => {
    try{
        const {content,  mediaIds} = req.body;
        const newlyCreatedPost = new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || [],
        });

        await newlyCreatedPost.save();
        logger.infor("Post created successfully", newlyCreatedPost);
        res.status(201).json({
            success : true,
            message  : "Post create successfully"
        })
    }catch(e){
        logger.error("Error creating post", error)
        res.sttaus(500).json({
            success : false,
            message : "Error creating post",
        })
    }
}

const getAllPosts = async(req,res) => {
    try{

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