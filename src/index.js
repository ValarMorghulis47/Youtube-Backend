import dotenv from "dotenv";

import connectdb from "./db/connection.js";
import app from "./app.js";

dotenv.config({
    path: "./.env"
})

connectdb()
.then(()=>{
    app.on("Error",(error)=>{
        console.log("Error", error)
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App Is listening on the port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Databse Connection error", error)
})