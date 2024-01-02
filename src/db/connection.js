import mongoose from "mongoose";

const connectdb= async ()=>{
    try {
        const obj=await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.MONGODB_DB_Name}`);
        console.log(`Mongo Db connected. DB Host: ${obj.connection.host}`);
    } catch (error) {
        console.log("DB Conncetion Error: ", error);
        process.exit(1);
    }
}

export default connectdb;