import dotenv from "dotenv"
import dbConnect from "./config/dbConnect.js";
import { app } from "./app.js";

dotenv.config({path: "./.env"});

dbConnect()
.then(() => app.listen(process.env.PORT || 8000, () => console.log(`Server is running of http://localhost:${process.env.PORT || 8000}`)))
.catch((error) => console.log("There is error DB connection = ", error));

app.on("error", (error) => console.log("There is while initializing server :: ", error))