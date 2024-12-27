import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const options = {
    httpOnly: true,
    secure: true
};

const generateAccessAndRefreshToken = async(userId) =>
{
    try
    {
        const userExist = await User.findById(userId);

        const accessToken = await userExist.generateAccessToken();
        const refreshToken = await userExist.generateRefreshToken();

        userExist.refreshToken = refreshToken;
        await userExist.save({validateBeforeSave: false}); // This will save the document directly without validating the saved data

        return {accessToken, refreshToken};
    }
    catch(error)
    {
        throw new ApiError(500, "Error occur while generating access and refresh token")
    }
}


const registerUser = asyncHandler(async (req, res) =>
{
    // Extract data from frontend
    const {userName, email, password, fullName} = req.body;
    // console.table([userName, email, password, fullName]);

    // Validate data
    if([fullName, email, password, userName].some((item) => (item === undefined || item.trim() === "")))
    {
        throw new ApiError(400, "All field are required (user.controller.js -> registerUser()")
    }

    // Check for already existing user
    const userExist = await User.findOne({
        $or: [{userName}, {email}]
    });

    if(userExist)
    {
        throw new ApiError(409, "User already exist with this email or username, try Login");
    }

    let avatarFilePath;
    let coverImagePath;

    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0)
    {
        avatarFilePath = req.files?.avatar[0]?.path;
    }
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImagePath = req.files?.coverImage[0]?.path;
    }


    // if([avatarFilePath, coverImagePath].some((item) => !item))
    // {
    //     throw new ApiError(400, "All fields are required (user.controller -> registerUser)");
    // }
    if(!avatarFilePath)
    {
        throw new ApiError(400, "Avatar image is required (user.controller -> registerUser)");
    }

    // Upload all image to cloudinary
    const avatarUpload = await uploadCloudinary(avatarFilePath);
    const coverImageUpload = await uploadCloudinary(coverImagePath);

    if(!avatarUpload)
    {
        throw new ApiError(409, "Avatartfile is not uploaded properly")
    }

    // Create user
    const newUser = await User.create(
        {
            fullName, 
            password, 
            email,
            userName: userName.toLowerCase(),
            avatar: avatarUpload.secure_url,
            coverImage: coverImageUpload?.secure_url || "",
        }
    );

    // By this the refresh token and password will be not selected in newUserExist
    const newUserExist = await User.findById(newUser._id).select("-password -refreshToken");

    if(!newUserExist)
    {
        throw new ApiError(500, "Something went wrong while registering a new user");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully", newUserExist)
    );
});

const loginUser = asyncHandler(async(req, res) =>
{
    // Data from User
    // check for data 
    // check for user existness
    // compare password
    // generate access and refresh token

    const {email, userName, password} = req.body;

    if(!email && !userName)
    {
        throw new ApiError(400, "Email or userName is required");
    }

    if(!password) throw new ApiError(409, "Password is not given");

    const userExist = await User.findOne({
        $or:[{email}, {userName}]
    });

    if(!userExist)
    {
        throw new ApiError(404, "User never existed try signup");
    }

    // if(!(await bcrypt.compare(password, userExist.password)))
    // {
    //     throw new ApiError(401, "Password is incorret try again");
    // }
    
    if(!(await userExist.isPasswordCorrect(password)))
    {
        throw new ApiError(401, "Password is incorret try again");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(userExist._id);
     
    userExist.accessToken = accessToken;

    delete userExist.refreshToken;
    delete userExist.password;

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, "User LoggedIn successfully", {accessToken, refreshToken, user:userExist})
    );

});

const logoutUser = asyncHandler(async(req, res) => 
{
    const userId = req.user?._id;
    await User.findByIdAndUpdate(userId, 
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {new: true}
    );


    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    res.status(200).json(
        new ApiResponse(200, "User loggedOut successfully")
    );
});

const newAccessAndRefreshToken = asyncHandler(async(req, res) =>
{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(404, "Token is not provided or unauthorized request");
    }

    const decodedData = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const userExist = await User.findById(decodedData?._id);
    
    if(incomingRefreshToken !== userExist.refreshToken)
    {
        throw new ApiError(400, "Invalid Token try login again");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(userExist._id);

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, "Access token is renewed and user can stay logged in", {user: userExist, refreshToken, accessToken})
    );


});

export {registerUser, loginUser, logoutUser};