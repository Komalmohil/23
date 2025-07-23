const mongoose = require("mongoose");
const { Schema } = mongoose;
const User =require('./User');
const otpSchema = new mongoose.Schema({
  email: {type: String, required: true},
  otp: {type: String, required: true},
  otpExpires: {type: Date, required: true},
   userId:{ type: Schema.Types.ObjectId,ref:'User'},
   createdAt:{ type:Date,default:Date.now, expires:"5m" },
});

module.exports = mongoose.model("Otp", otpSchema);
