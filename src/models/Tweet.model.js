import {mongoose} from "mongoose";

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types, ObjectId,
        ref: "User"
    },
    
}, {timestamps: true});

export const Tweer = mongoose.model("Tweet", tweetSchema);