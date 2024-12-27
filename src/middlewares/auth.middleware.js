import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/User.model.js"


// Here we can see that "res" is not used so we can write this "_" just to remove the not used variable warning
export const verifyJWT = asyncHandler(async(req, _, next) =>
{
    try {
        const token = req.cookies['accessToken'] || req.header("Authorization")?.replace("Bearer ", "");
        if(!token)
        {
            throw new ApiError(401, "Token is available for authentication");
        }
        console.log(req.cookies);

        console.log(2);
        const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userExist = await User.findById(decodedData?._id).select("-password -refreshToken");
        
        console.log(3);
        if(!userExist)
            {
                // Todo: Discuss about frontend 
                throw new ApiError(404, "Access token is invalid");
            }
            
            console.log(4);
        req.user = userExist;
        next();
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while verifying JWT at auth.middleware");
    }
});