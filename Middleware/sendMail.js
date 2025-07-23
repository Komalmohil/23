const nodemailer =require('nodemailer');
require('dotenv').config();
const sendMail =async ({ to, subject, html }) => {
  const transporter =nodemailer.createTransport({
    service:'gmail',
    auth: {
      user: process.env.email,
      pass: process.env.pass,
    },
  });
  const mailOptions ={
    from: process.env.email,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success:true };
  } catch(error){
    console.error("Email send error:",error);
    return { success:false, error };
  }
};
module.exports=sendMail;
