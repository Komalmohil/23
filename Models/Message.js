const mongoose = require("mongoose");
const { Schema }= mongoose;

const messageSchema = new mongoose.Schema({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  rideId: { type: Schema.Types.ObjectId,ref: "Ride", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
