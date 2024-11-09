import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async() =>
{
    try{
        const connectionResponse = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`DB connect successfully || DB HOST :: ${connectionResponse}`);
    }
    catch(Error)
    {
        console.log("Error :: ", Error);
        process.exit(1); // Process refer to the current reference where our application is running
    }
}

export default dbConnect;