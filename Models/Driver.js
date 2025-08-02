const mongoose = require('mongoose');
const { Schema } = mongoose;

const driverSchema = new Schema({
  user:{type:Schema.Types.ObjectId, ref:'User',required: true },
  carModel:{type:String, required:true },
  licenseNumber: {type: String,required: true },
  seatCapacity:{type: Number,required: true }
});

module.exports= mongoose.model('Driver', driverSchema);
