import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // Cloudinary URL
        required: true, 
    },
    coverImage: {
        type: String, 
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String, 
        required: [true, "Password is required !!"],
    },
    refreshToken: {
        type: String, 
    }

}, {timestamps: true});

userSchema.pre("save", async function(next)
{
    if(this.isModified("password"))
    {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

export const User = mongoose.model("User", userSchema);