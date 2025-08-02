const express =require('express');
const router=express.Router();
const verifyToken= require('../Middleware/verifyToken');
const auth =require('../Middleware/authRoute');

const {renderRideForm,createRide,getRideDetails,getSearched,bookRide,getAllRides,searchRides,
    getPublishedRides,acceptBooking,rejectBooking,getBookingRequests,bookedUsers,getMyBookingRequests}=require('../controllers/rideController');

router.get('/publish',auth,renderRideForm);
router.get('/search',auth,searchRides);
router.get('/ride/:rideId', auth,getRideDetails);
router.get('/get-rides',getAllRides);

router.post("/search-rides",auth,getSearched);
router.post('/create-ride',verifyToken,createRide);
router.post('/book-ride',verifyToken,bookRide);
router.get('/published-rides',verifyToken,getPublishedRides);

router.get('/ride/:rideId/requests',verifyToken,getBookingRequests);
router.post('/ride/:rideId/booking/:bookingId/accept',verifyToken,acceptBooking);
router.post('/ride/:rideId/booking/:bookingId/reject',verifyToken,rejectBooking);

router.get("/ride/:rideId/bookings",verifyToken,bookedUsers)
router.get("/my-booking-requests",verifyToken,getMyBookingRequests);


module.exports =router;
