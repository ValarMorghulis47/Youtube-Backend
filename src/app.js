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
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/likes", likeRouter)
export default app;