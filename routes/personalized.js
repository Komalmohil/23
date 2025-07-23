const express= require('express');
const router =express.Router();
const verifyToken =require('../Middleware/verifyToken');

const { getBookedRides,getUserProfile,submitRating, showInbox,notify} =require('../controllers/personalController.js');

router.get('/booked-rides',verifyToken,getBookedRides);
router.get('/profile',verifyToken,getUserProfile);
router.post('/rating',verifyToken,submitRating);


router.get('/inbox/:rideId/:receiverId/:senderId', verifyToken, showInbox);
router.get("/notification",verifyToken,notify)
module.exports = router;
