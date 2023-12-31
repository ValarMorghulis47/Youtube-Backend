import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken; // adding refresh token in the user database
        await user.save({ ValidateBeforeSave: false }) //dont validate. we just want save the referesh token in the database
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while making the tokens")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // const { fullname, username, email, password } = req.body;
    // if (![fullname, username, email, password].every((field) => typeof field === 'string' && field.trim() !== "")) {
    //     throw new ApiError(400, "All Fields Are Required");
    // }

    const { fullname, username, email, password } = req.body;
    // console.log(`emial ${typeof email}`);
    // console.log(req.body)
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    if (!email.includes('@')) {
        throw new ApiError(400, "@sign is missing in the email field");
    }
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(408, "Username or Email Already Exists");
    }
    // console.log(req.files);

    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverimage[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    else {
        throw new ApiError(408, "Avatar File Is Required");
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverImageLocalPath = req.files.coverimage[0].path
    }
    else {
        throw new ApiError(408, "Cover Image File Is Required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverimage = await uploadOnCloudinary(coverImageLocalPath);

    // if (!avatar) {
    //     throw new ApiError(408, "Avatar File Is Required");
    // }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage.url,
        email,
        username,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    console.log(email, password)
    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new ApiError(408, "User Does Not Exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid Password")
    }
    const {accessToken, refreshToken} = await generateTokens(user._id);
    const loggedinuser= await User.findById(user._id).select("-password -refreshToken");  //we made another call to database beacuse the user we got above did not had the refresh token because it was null.
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedinuser,accessToken, refreshToken
        }, "User Logged In Successfully")
    )
})

const logoutUser= asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: {
                refreshToken: undefined
            }
        },
        { 
            new: true 
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {} ,"User Logged Out Successfully")
    )
})

export { registerUser, loginUser, logoutUser };