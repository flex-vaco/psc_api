require('dotenv').config();
const nodemailer = require('nodemailer');
const MAIL_ID = process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PSWD,
    },
    secure: true,
});

module.exports = {
    transporter,
    MAIL_ID
};
