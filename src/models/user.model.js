import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatarPublicId : {
        type: String,
        required: true,
    },
    coverimagePublicId : {
        type: String,
        required: true,
    },
    avatar: {
        type: String, // Cloudinary URL
        required: true,
    },
    coverimage: {
        type: String, // Cloudinary URL
        required: true,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password Is Required"],
    },
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true
})
//we want the "this" reference that's why we used function not callback function like arrow function and since it is a middleware we have to use the next flag
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
        next()
    }
    else {
        return next();
    }
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)