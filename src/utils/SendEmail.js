import nodemailer from "nodemailer";
import ApiError from "./ApiError";

const sendmail = async (options)=>{
    try {
        const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
              user: process.env.EMAIL_USERNAME,
              pass: process.env.EMAIL_PASSWORD
            }
          });
        const emailoptions = {
            from: "Youtube Development Team",
            to: options.email,
            subject: options.subject,
            // html: options.html //we can also send html
            text: options.message
        }
        await transport.sendMail(emailoptions)
    } catch (error) {
       throw new ApiError(501, "There was an error in sending the email")
    }
}

export {sendmail}