const mongoose =require('mongoose');
const { Schema }= mongoose;
const User =require('./User');
const Ride=require('./Ride');

const notificationSchema=new mongoose.Schema({
  user:{ type: Schema.Types.ObjectId,ref:'User',required:true},
  message:{ type: String, required: true },
  rideId:{ type: Schema.Types.ObjectId,ref:'Ride'},
  isRead:{type:Boolean, default:false}
});

module.exports = mongoose.model('Notification', notificationSchema);
