const express = require("express");
const {createPost, getAllPosts} = require("../controllers/post-controller");
const {authenticateRequest} = require("../middleware/authMiddleware");

const router = express();

//middleware -> this will tell if the user is auth user or not
router.use(authenticateRequest)

router.post("/create-post", createPost)
router.get("/all-posts", getAllPosts)

module.exports = router;
