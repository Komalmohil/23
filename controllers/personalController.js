const Message=require("../Models/Message");
const Booking = require('../Models/Booking');
const Ride = require('../Models/Ride');
const User = require('../Models/User');
const Notification = require('../Models/Notification'); 

exports.getBookedRides =async(req,res)=>{
  try {
    const allBookedRides = await Booking.find({ $or:[{userId: req.userId},{bookedForUserId:req.userId }],bookingStatus:"accepted"}).populate("userId").populate("rideId");
            console.log("u",req.userId,"r",req.rideId)
   console.log(allBookedRides);

    const today=new Date().toISOString().slice(0,10)
    const upcomingRides=[];
    const pastRides=[];
    console.log(typeof(req.userId))
   // const selfFiltered =allBookedRides.filter(b=>console.log(typeof(b.userId._id.toString()))); 

    const selfFiltered =allBookedRides.filter(b=>b.bookingFor==="myself");
    // //&&  b.userId._id.toString() == req.userId); 
    console.log("myself-------",selfFiltered);

    const other= allBookedRides.filter(b=>b.bookingFor==="other")
    //&& b.bookedForUserId.toString()===req.userId);
      console.log("someone else------",other);
  
    selfFiltered.forEach(booking=>{     
      const rideDate=booking.rideId.date;
      if(rideDate>=today){ upcomingRides.push(booking);} 
      else{ pastRides.push(booking);} 
  });
    other.forEach(booking=>{  
      const rideDate=booking.rideId.date;
      if(rideDate>=today){ upcomingRides.push(booking);} 
      else{ pastRides.push(booking);}
  });

    res.render("booked", {upcomingRides,pastRides,isLoggedIn:req.isLoggedIn,username:req.username,userId:req.userId});
 
  }catch(err){
    console.error(err);
    res.status(500).send("fetching err");
  }
};

exports.getUserProfile=async (req,res)=>{
  try {
    const user=await User.findById(req.userId);
    res.render('profile',{user,isLoggedIn: req.isLoggedIn,username: req.username,userId: req.userId});
  } catch(err){
    console.error(err);
    res.status(500).send("profile err");
  }
};

exports.submitRating =async(req,res)=>{
  try {
    const {rating,bookingId}=req.body;
    const booking =await Booking.findById(bookingId);
    if(!booking)   return res.status(404).send("Booking not found");
   if(rating>5||rating<1){
     return res.status(404).send("Invalid rating count");
   }
    booking.rating =rating;
    await booking.save();
    res.send("Rating updated");
  } catch(err){
    console.error(err);
    res.status(500).send("Failed to update rating");
  }
};
exports.showInbox = async (req, res) => {
  const {rideId,receiverId,senderId}=req.params;
  console.log("in show inbox");
  console.log("Sender:", senderId);
  console.log("Receiver:", receiverId);
  console.log("Ride:", rideId);

  try {
    const messages=await Message.find({ rideId,$or:[{sender:senderId,receiver:receiverId },{sender:receiverId,receiver:senderId }] });
    const roomId = [senderId,receiverId,rideId].sort().join("_");
    res.render("inbox",{messages,rideId,receiverId,senderId,roomId, 
      isLoggedIn: req.isLoggedIn, username: req.username  });
  } catch(err){
    console.error(err);
    res.status(500).send("Error loading inbox");
  }
};


exports.notify=async (req,res)=>{
  try {
    const notifications=await Notification.find({ user:req.userId })
    res.render('notifications',{notifications,isLoggedIn: req.isLoggedIn,username: req.username,userId: req.userId });
  } catch(err){
    console.error(err);
    res.status(500).send("notify err");
  }
};
