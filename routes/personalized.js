const express= require('express');
const router =express.Router();
const verifyToken =require('../Middleware/verifyToken');

const { getBookedRides,getUserProfile,submitRating, showInbox,notify,read,getChat,updateDriver} =require('../controllers/personalController.js');

router.get('/booked-rides',verifyToken,getBookedRides);
router.get('/profile',verifyToken,getUserProfile);
router.post('/driver',verifyToken,updateDriver);
router.post('/rating',verifyToken,submitRating);


router.get('/inbox/:rideId/:receiverId/:senderId', verifyToken, showInbox);
router.get("/notification",verifyToken,notify)
router.get('/notification/read/:id',verifyToken,read);
router.get("/inbox/:roomId",verifyToken,getChat)

module.exports = router;
