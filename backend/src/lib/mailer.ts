import nodemailer from 'nodemailer';
import htmlToText from 'html-to-text';
import { environment } from '../config/environment';

let transporter = nodemailer.createTransport({
  host: environment.smtp.host,
  port: environment.smtp.port,
  auth: {
    user: environment.smtp.user,
    pass: environment.smtp.password
  }
});


const mailOptions = {
  from: environment.smtp.user,
};

export function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({ ...mailOptions, to, subject, text: htmlToText.convert(html), html }, (error, info) => {
    if (error) {
      return console.log("Error:", error);
    }
    console.log("Email sent:", info.response);
    return info.response;
  });
}