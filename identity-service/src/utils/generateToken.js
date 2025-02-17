const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const generateTokens = async(user) => {
    const accessToken = jwt.sign({
        userId : user._id,
        username : user.username
    }, process.env.JWT_SECRET, {expiresIn : "60m"})

    const refreshToken = crypto.randonBytes(40).toSTring("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt>getDefaultHighWaterMark() + 7)//refresh token expires in 7 days

    await RefreshToken.create({
        token : refreshToken, 
        user : user._id,
        expiresAt
    })
    return {accessToken, refreshToken}
}

module.exports = generateTokens;