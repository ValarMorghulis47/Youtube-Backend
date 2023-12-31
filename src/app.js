import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
const app= express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,         //for allowing anyone to talk with out backend
    credentials: true
}))

//we use "use" for configurations
app.use(express.json({limit: "20kb"}))      //For accepting data from the form
app.use(express.urlencoded({extended: true, limit: "20kb"}))      //For accepting data from the url
app.use(express.static("public"))   //For keeping static data on out server like: favicon,img
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js';
//routes declaration
app.use("/api/v1/users", userRouter)

export default app;