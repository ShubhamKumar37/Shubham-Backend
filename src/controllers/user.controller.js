import { User } from "../models/User.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) =>
{
    // Extract data from frontend
    const {userName, email, password, fullName} = req.body;
    console.table([userName, email, password, fullName]);

    // Validate data
    if([fullName, email, password, userName].some((item) => item.trim() === ""))
    {
        throw new  ApiError(400, "All field are required (user.controller.js -> registerUser()")
    }

    // Check for already existing user
    const userExist = await User.findOne({
        $or: [{userName}, {email}]
    });

    if(userExist)
    {
        throw new ApiError(409, "User already exist with this email or username, try Login");
    }

    const avatarFilePath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    if([avatarFilePath, coverImagePath].some((item) => !item))
    {
        throw new ApiError(400, "All fields are required (user.controller -> registerUser)");
    }
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

export {registerUser};