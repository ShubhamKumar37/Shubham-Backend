import dotenv from "dotenv"
import express from "express"
import dbConnect from "./config/dbConnect";

dotenv.config({path: "../.env"});
const app = express();

dbConnect();