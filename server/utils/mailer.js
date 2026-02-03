// Load environment variables based on NODE_ENV
require("../config/env.js");

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
async function sendOTPEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `RightShift InfoTech`,
    to: toEmail,
    subject: "Your Password",
    text: `Welcome to RightShift InfoTech. Your password is: ${otp}. It will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
    html: `<h3>Welcome to RightShift InfoTech.</h3><p>Your password is: <strong>${otp}</strong></p>`,
  });
}
async function sendResetOTPEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `Rajesh Jain Academy`,
    to: toEmail,
    subject: "Reset your password",
    text: `Welcome to Rajesh Jain Academy. Your OTP to reset the password is: ${otp}. It will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
    html: `<h3>Welcome to Rajesh Jain Academy.</h3><p>Your OTP to reset the password is: <strong>${otp}</strong></p><p>This will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
}
module.exports = { sendOTPEmail, sendResetOTPEmail };
