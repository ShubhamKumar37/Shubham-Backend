import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({limit: "16Kb"})); // Limit specify the size of the request from front end
app.use(express.urlencoded({extended: true, limit: "16Kb"}));
app.use(express.static("public"));    // A place where some assest are stored
app.use(cookieparser());

// Import router
import userRouter from "./routes/user.route.js";

// Declare router
app.use("/api/v1/users", userRouter);


export {app};   