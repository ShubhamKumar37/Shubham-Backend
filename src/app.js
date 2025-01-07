import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"
import dotenv from "dotenv"

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: "16Kb" })); // Limit specify the size of the request from front end
app.use(express.urlencoded({ extended: true, limit: "16Kb" }));
app.use(express.static("public"));    // A place where some assest are stored
app.use(cookieparser());

// Import router
import userRouter from "./routes/user.route.js";
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import videoRouter from "./routes/video.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import dashboardRouter from "./routes/dashboard.route.js"

// Declare router
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)


export { app };   