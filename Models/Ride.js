const mongoose = require('mongoose');
const { Schema } = mongoose;

const rideSchema = new mongoose.Schema({
  publisher: { type: Schema.Types.ObjectId, ref: 'User' },

  location: { type: String, required: true },
  destination: { type: String, required: true },
  date: { type: String, required: true },
  pickupTime: { type: String, required: true },

  seats: { type: Number, required: true },
  price: { type: Number, required: true },

  returnTrip: { type: Boolean, default: false },
  returnTripDone: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },

  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  returnTripId: { type: Schema.Types.ObjectId, ref: 'Ride' },

  pickup: { point: String, lat: Number, lng: Number},
  dropoff: { point: String,  lat: Number, lng: Number},
 routeIndex: { type: Number, required: true },
});

module.exports = mongoose.model('Ride', rideSchema);
