const mongoose =require('mongoose');
const { Schema }= mongoose;

const notificationSchema=new mongoose.Schema({
  user:{ type: Schema.Types.ObjectId,ref:'User',required:true},
  message:{ type: String, required: true },
  rideId:{ type: Schema.Types.ObjectId,ref:'Ride'},
  roomId:{type:String, default:""},
  bookingId: { type: Schema.Types.ObjectId, ref:'Booking'},
  isRead:{type:Boolean, default:false},
  readAt: { type: Date }
});

notificationSchema.index({readAt:1},{expireAfterSeconds:120});

module.exports = mongoose.model('Notification', notificationSchema);
