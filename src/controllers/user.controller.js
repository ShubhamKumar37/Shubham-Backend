import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const options = {
    httpOnly: true,
    secure: true
};

const getFilePublicId = (url) => {
    if (!url) return null;

    const parts = url.split("/").at(-1).split(".")[0];

    return process.env.CLOUDINARY_FOLDER + parts;
};



const generateAccessAndRefreshToken = async (userId) => {
    try {
        const userExist = await User.findById(userId);

        const accessToken = await userExist.generateAccessToken();
        const refreshToken = await userExist.generateRefreshToken();

        userExist.refreshToken = refreshToken;
        await userExist.save({ validateBeforeSave: false }); // This will save the document directly without validating the saved data

        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new ApiError(500, "Error occur while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // Extract data from frontend
    const { userName, email, password, fullName } = req.body;
    // console.table([userName, email, password, fullName]);

    // Validate data
    if ([fullName, email, password, userName].some((item) => (item === undefined || item.trim() === ""))) {
        throw new ApiError(400, "All field are required (user.controller.js -> registerUser()")
    }

    // Check for already existing user
    const userExist = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (userExist) {
        throw new ApiError(409, "User already exist with this email or username, try Login");
    }

    let avatarFilePath;
    let coverImagePath;

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarFilePath = req.files?.avatar[0]?.path;
    }
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files?.coverImage[0]?.path;
    }


    // if([avatarFilePath, coverImagePath].some((item) => !item))
    // {
    //     throw new ApiError(400, "All fields are required (user.controller -> registerUser)");
    // }
    if (!avatarFilePath) {
        throw new ApiError(400, "Avatar image is required (user.controller -> registerUser)");
    }

    // Upload all image to cloudinary
    const avatarUpload = await uploadCloudinary(avatarFilePath);
    const coverImageUpload = await uploadCloudinary(coverImagePath);

    if (!avatarUpload) {
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

    if (!newUserExist) {
        throw new ApiError(500, "Something went wrong while registering a new user");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully", newUserExist)
    );
});

const loginUser = asyncHandler(async (req, res) => {
    // Data from User
    // check for data 
    // check for user existness
    // compare password
    // generate access and refresh token

    const { email, userName, password } = req.body;

    if (!email && !userName) {
        throw new ApiError(400, "Email or userName is required");
    }

    if (!password) throw new ApiError(409, "Password is not given");

    const userExist = await User.findOne({
        $or: [{ email }, { userName }]
    });

    if (!userExist) {
        throw new ApiError(404, "User never existed try signup");
    }

    // if(!(await bcrypt.compare(password, userExist.password)))
    // {
    //     throw new ApiError(401, "Password is incorret try again");
    // }

    if (!(await userExist.isPasswordCorrect(password))) {
        throw new ApiError(401, "Password is incorret try again");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userExist._id);

    userExist.accessToken = accessToken;

    delete userExist.refreshToken;
    delete userExist.password;

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User LoggedIn successfully", { accessToken, refreshToken, user: userExist })
        );

});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    await User.findByIdAndUpdate(userId,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        { new: true }
    );


    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    return res.status(200).json(
        new ApiResponse(200, "User loggedOut successfully")
    );
});

const newAccessAndRefreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(404, "Token is not provided or unauthorized request");
    }

    try {
        const decodedData = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const userExist = await User.findById(decodedData?._id);

        if (incomingRefreshToken !== userExist.refreshToken) {
            throw new ApiError(400, "Invalid Token try login again");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userExist._id);

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, "Access token is renewed and user can stay logged in", { user: userExist, refreshToken, accessToken })
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while renewing refresh and access token");
    }


});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "You need to provide new and old password both");
    }

    const user = await User.findById(userId);
    if (!(await user.isPasswordCorrect(oldPassword))) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "Password changed successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, "Current user fetched successfully", req.user)
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;

    if (!email && !fullName) {
        throw new ApiError(409, "Provided atleast one detail to be updated");
    }

    const updateOption = {};
    if (email) updateOption.email = email;
    if (fullName) updateOption.fullName = fullName;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateOption
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, "User details updated successfully", user)
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file.path;

    console.log("This is the file path = ", avatarLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatarUpload = await uploadCloudinary(avatarLocalPath);
    if (!avatarUpload) {
        throw new ApiError(400, "Error occur while uploading avatar to cloudinary");
    }

    const userInfo = await User.findById(req.user._id).select("-password");

    const publicId = getFilePublicId(userInfo.avatar);
    await deleteFromCloudinary(publicId, req.file.mimetype.split("/")[0]);

    userInfo.avatar = avatarUpload.secure_url;
    userInfo.save({ new: true, validateBeforeSave: false });


    return res.status(200).json(
        new ApiResponse(200, "Avatar updated successfully", userInfo)
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImageUpload = await uploadCloudinary(coverImageLocalPath);
    if (!coverImageUpload) {
        throw new ApiError(400, "Error occur while uploading cover image to cloudinary");
    }

    const userInfo = await User.findById(req.user._id).select("-password");

    const publicId = getFilePublicId(userInfo.coverImage);
    await deleteFromCloudinary(publicId, req.file.mimetype.split("/")[0]);

    userInfo.coverImage = coverImageUpload.secure_url;
    userInfo.save({ new: true, validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "Cover image updated successfully", userInfo)
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    if (!userName) {
        throw new ApiError(409, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo",
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req?.user._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                userName: 1,
                subscribers: 1,
                subscribeTo: 1,
                isSubscribed: 1.
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnot exist");
    }

    console.log("This is the pipleline result = ", channel);

    return res.status(200).json(
        new ApiResponse(200, "Here is the channel details", channel[0])
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const user = await User.aggregate([
        {
            $match:{_id: userObjectId}
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1,
                                        userName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    if (!user) {
        throw new ApiError(300, "No views for this video")
    }

    return res.status(200).json(
        new ApiResponse(200, "All watch history data", user[0].watchHistory)
    );
});

export {
    registerUser, loginUser, logoutUser, newAccessAndRefreshToken, changeCurrentPassword,
    getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile,
    getWatchHistory,
};
