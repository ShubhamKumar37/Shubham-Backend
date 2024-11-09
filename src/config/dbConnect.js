import mongoose from "mongoose";
import { DB_NAME } from "../constants";

export default dbConnect = async() =>
{
    try{
        const connectionResponse = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });

        console.log(`DB connect successfully || DB HOST :: ${connectionResponse}`);
    }
    catch(Error)
    {
        console.log("Error :: ", Error);
        process.exit(1); // Process refer to the current reference where our application is running
    }
}