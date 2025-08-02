const Ride = require('../Models/Ride');
const Booking = require('../Models/Booking');
const User=require("../Models/User")
const Notification=require("../Models/Notification")

exports.renderRideForm=(req,res)=>{res.render('ride', { isLoggedIn:req.isLoggedIn,username:req.username });};

exports.createRide = async(req,res)=>{
try {
  console.log("Received:", req.body);
    const { location, destination,date,pickupPoint,dropoffPoint, pickupTime,seats,price,pickupLat,pickupLng,dropLat,dropLng,routeIndex}= req.body;  
      
    
   // console.log( location, destination,date,pickupPoint,dropoffPoint, pickupTime,seats,price,pickupLat,pickupLng,dropLat,dropLng,routeIndex);
    //  returnTrip,returnTripDone,later,
      

    if(!location||!destination ||!date ||!pickupPoint||!dropoffPoint
      ||!pickupTime ||!seats||!price||!pickupLat
      ||!pickupLng ||!dropLat ||!dropLng||!routeIndex) { return res.status(400).json({error:"Incomplete ride details"});}

   //  console.log(pickupTime)
     //console.log(new Date().toISOString().slice(11,16))
     
    // if(!pickupTime || !timeRegex.test(pickupTime)){return res.status(400).json({error: "Invalid pickup time format"});}
  const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    function to12Hour(hhmm){
      const [h,m] =hhmm.split(":");
      const suffix = h>=12 ?"PM":"AM";
      const hour12 = (h%12)||12;
      return `${hour12}:${String(m).padStart(2,"0")} ${suffix}`;
    }

    if (!pickupTime||!time24Regex.test(pickupTime)) {return res.status(400).json({ error: "Invalid pickup time format" }); }
    const formattedPickupTime = to12Hour(pickupTime);

     const min =new Date().toISOString().slice(0,10);
    if(date<min){return res.status(400).json({error: "The date has already passed"}); }

    if (isNaN(price)|| price<=0) {return res.status(400).json({error: "Invalid price. Must be a number greater than 0"});}

    if (isNaN(routeIndex)|| routeIndex<0) {return res.status(400).json({error: "Invalid route"});}

    if(seats<1){return res.status(400).json({error: 'Passengers must be at least 1'}); }

    const ride=new Ride({
        publisher: req.userId,
        location, destination,date,pickupTime:formattedPickupTime,seats,price,routeIndex,
          //   returnTrip:returnTrip=== 'on',
          //  returnTripDone:returnTripDone==='on',
          //   later: later==='on',
           pickup: {point: pickupPoint,lat: pickupLat,lng: pickupLng},
          dropoff: { point: dropoffPoint, lat: dropLat, lng: dropLng},
        });
        await ride.save();
      res.status(200).json({ redirectTo:"/search"});
    }catch(err){ console.error(err);
        res.status(500).json({error: 'Error creating ride'}); }
};

exports.getRideDetails = async (req, res) => {
  try {
     const { rideId }=req.params;
    const ride=await Ride.findById(rideId).populate("publisher");
   // console.log("ride",ride)
    if (!ride) return res.status(404).send('Ride not found');
    res.render('details', { ride,isLoggedIn: req.isLoggedIn,username:req.username, userId:req.userId });
  } catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
};


exports.bookRide = async (req, res) => {
  try{
    const {
  rideId, passengerName,passengersNo, phoneNumber,
  otherPassengerName,passengerEmail,phoneNo,no,bookingFor,
  pickupLat, pickupLng, dropLat, dropLng
} = req.body;

// if(req.userId){
//   console.log("in validation",req.userId)
//    const ride=await Ride.findById(rideId).populate("publisher");
//    console.log("ride found")
//    console.log(typeof(req.userId),"sdjhhjsdj",typeof(ride.publisher._id))

//    if(req.userId === (ride.publisher._id).toString()){
//     console.log("in validation",ride.publisher._id)
//      return res.status(400).json({ error: "This ride was published by you!" });
//    }
// }

    if((bookingFor==="")) { return res.status(400).json({ error: "You need to select one option" }); }
    if((bookingFor==="myself" && (!passengerName||!passengersNo ||!phoneNumber))||(bookingFor ==="other" && (!otherPassengerName||!passengerEmail||!no||!phoneNo))) {
      return res.status(400).json({ error: "Booking details incomplete!" });
    }

    if((bookingFor==="myself")){
      const ride=await Ride.findById(rideId).populate("publisher");
  //  console.log("ride found")
  //  console.log(typeof(req.userId),"sdjhhjsdj",typeof(ride.publisher._id))
   if(req.userId === (ride.publisher._id).toString()){ return res.status(400).json({ error: "This ride was published by you!" });}
  }
    
   if (bookingFor==="other") { 
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(passengerEmail)){ return res.status(400).json({ error: "Invalid email format" }); }

    const ride = await Ride.findById(rideId).populate("publisher");
    if (passengerEmail === ride.publisher.email) {  return res.status(400).json({ error: "You are trying to book a ride for the one who published this ride." }); }
}

    const ride=await Ride.findById(rideId).populate("bookings");
    if(!ride) return res.status(404).json({ error: "Ride not found!" });

    const seatCount=bookingFor=== 'myself'?passengersNo:no;
    if(isNaN(seatCount)||seatCount<=0) return res.status(400).json({ error: "Invalid seat count" });
    if(ride.seats<=0) return res.status(400).json({ error: "The seats are already taken" });
    if(seatCount>ride.seats) return res.status(400).json({ error: `Please request for seats less than or equal to ${ride.seats}` });
      

    // console.log(phoneNo,"FDcf",phoneNumber)
    // console.log(typeof(Number(phoneNumber)));
    const phoneRegex = /^\d{10}$/; 
    const phone=bookingFor=== 'myself'?phoneNumber:phoneNo;
    //console.log(typeof(Number(phone)));
    if ((!phoneRegex.test(Number(phone)))) { return res.status(400).json({ error: "Phone number must be exactly 10 digits" });}

    let bookedForUserId=null;
    let email;
    if (bookingFor==='myself'){
      const user=await User.findById(req.userId).select("email");
      if (!user) return res.status(404).json({ error: "User not found!" });
      email= user.email;
    } 
    else {  email = passengerEmail; }

    if(bookingFor==='other') {
       const user=await User.findOne({email:passengerEmail });
       if(user){ bookedForUserId = user._id;}
    }else {bookedForUserId = req.userId;}

    const booking =new Booking({rideId,bookingFor, count: seatCount,
      userId:req.userId, 
      name: bookingFor==='myself'?passengerName:otherPassengerName,
      phoneNo: bookingFor=== 'myself'?phoneNumber:phoneNo,
      email,bookedForUserId,
      bookingStatus: "pending",
      pickupLat,pickupLng,dropLat,dropLng
    });
    await booking.save();
    ride.bookings.push(booking._id);
    await ride.save();
res.status(200).json({ message: "Request sent!" });

const io=req.app.get('io');
const userSockets=io.userSockets;
const publisherId=ride.publisher.toString();
const publisherSocket=userSockets[publisherId];

const newNotification={ user:publisherId,rideId:ride._id,bookingId: booking._id,
  message:`New booking request from ${booking.name}` };

if(publisherSocket){ console.log("Sending message to:",publisherId);
  publisherSocket.emit('newBookingRequest',newNotification);
}
try {
      await Notification.create(newNotification);
    }catch(notificationError) {
      console.error("Error saving notification:",notificationError);
    }

  }catch(err){
    console.error(err);
    res.status(500).json({ error:"Server err." });
  }
};

exports.getAllRides= async(req,res)=>{
  try {
    const rides= await Ride.find();
    const filtered= rides.filter(ride=>ride.seats>0);
    res.render('allrides',{rides:filtered,isLoggedIn:req.isLoggedIn,username:req.username});
  } catch(err){
    console.error(err);
    res.status(500).send('Get all rides err');
  }
};

exports.searchRides = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const allRides = await Ride.find();
    const upcomingRides = allRides.filter(ride => ride.date >= today);
    const availableRides = upcomingRides.filter(ride => ride.seats > 0);
    res.render('search', {rides: availableRides,isLoggedIn: req.isLoggedIn,username: req.username    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).send('Search error');
  }
};


exports.getPublishedRides=async(req,res)=>{
  try {
    const rides=await Ride.find({publisher:req.userId });
   // const notifications=await Notification.find({ user:req.userId,isRead:false})

    res.render('publishedRides',{rides,isLoggedIn: req.isLoggedIn,username: req.username,userId:req.userId  });
  } catch(err){
    console.error(err);
    res.status(500).send('Published err');
  }
};


exports.getSearched=async(req,res)=>{
  const {location,destination,date,passengers}=req.body;

  const allRides=await Ride.find();
  const today=new Date().toISOString().slice(0,10);
  const upcomingRides=allRides.filter(ride =>ride.date>=today &&ride.seats>0);

console.log(upcomingRides.length)

  if(!location||!destination){
    return res.render("search",{error:"Incomplete details",rides:upcomingRides,isLoggedIn:req.isLoggedIn,username:req.username });
  }
   if(isNaN(passengers)||passengers<1){return res.status(400).send('Passengers must be at least 1'); }
  
  try {
    const matchedRides=upcomingRides.filter(ride => {
      const loc= ride.location.toLowerCase()===location.toLowerCase();
      const dest=ride.destination.toLowerCase()===destination.toLowerCase();
      const matchDate=  date ? ride.date>=date : true;
      const people=passengers? ride.seats>=passengers:true;
 
      console.log("date",date,"date2",ride.date, ride.seats,passengers, loc,dest,matchDate,people)
      return loc && dest && matchDate && people;
    });
       console.log(matchedRides.length)
    return res.render("search", {rides:matchedRides,isLoggedIn:req.isLoggedIn,username: req.username});
  } catch(err){
    console.error(err);
  }
};

exports.getBookingRequests=async(req,res)=>{
  const {rideId}= req.params;
  const ride=await Ride.findById(rideId).populate('bookings');
 // console.log(ride);

  if(!ride) {return res.status(404).send("Ride not found");}
  console.log(typeof(ride.publisher))
  console.log(typeof(req.userId))

  if(ride.publisher.toString()!==req.userId){ return res.status(500).send("Publisher does not exist");}

  const pendingBookings=ride.bookings.filter(b =>b.bookingStatus==='pending');
  console.log(pendingBookings)

  res.render('bookingRequests',{ride,pendingBookings,isLoggedIn:req.isLoggedIn,username:req.username });
};



exports.acceptBooking=async(req,res)=>{
  try {
    const booking=await Booking.findById(req.params.bookingId).populate('rideId');
    if(!booking) return res.status(404).send("Booking not found");
   // console.log(typeof(booking.rideId.publisher))

    if(booking.rideId.publisher.toString()!== req.userId) {return res.status(500).send("Publisher not found");}
    if(booking.bookingStatus!=='pending'){ return res.status(500).send("Booking status err"); }
    if(booking.count>booking.rideId.seats){  return res.status(500).send("Not enough seats available");}
    
    booking.bookingStatus='accepted';
    booking.rideId.seats-=booking.count;
    await booking.save();
    await booking.rideId.save();

    const notification= new Notification({
      user: booking.userId, 
      message: `Your ride request for booking has been accepted!`,
      rideId: booking.rideId,
      isRead: false 
    });
    await notification.save();
   await Notification.findOneAndUpdate({bookingId: booking._id,  user: booking.rideId.publisher}, {isRead:true, readAt:new Date()});

    res.send("Booking approved!");
  } catch(err){ console.error(err);
    res.status(500).send("Error approving");
  }
};

exports.rejectBooking=async(req,res)=>{
  try{
    const booking=await Booking.findById(req.params.bookingId).populate('rideId');
    if (!booking) return res.status(404).send("Booking not found");
    if (booking.rideId.publisher.toString()!== req.userId) { return res.status(500).send("Publisher not found");}
    
    booking.bookingStatus='rejected';
    await booking.save();

   const notification = new Notification({
      user: booking.userId, 
      message: `Your ride request for booking has been rejected!`,
      //rideId: booking.rideId._id,
      isRead: false 
    });
   
    try {
       await notification.save();
    } catch(notificationError) {
      console.error("reject notification:", notificationError);
    }
    console.log("publisher",booking.rideId.publisher)
   await Notification.findOneAndUpdate({bookingId: booking._id, user:booking.rideId.publisher}, {isRead:true,readAt:new Date() });
    res.send("Booking rejected.");
  }catch(err){ console.error(err);
    res.status(500).send("Error rejecting booking");
  }
};

exports.bookedUsers=async (req,res)=>{
  const {rideId}= req.params;
  const userId=req.userId; 
  try {
    const ride=await Ride.findById(rideId);
    if (!ride) return res.status(404).send("Ride not found");
     //console.log(ride);
    if(ride.publisher.toString()!==userId) { return res.status(403).send("Access denied");  }

     const bookings = await Booking.find({rideId,bookingStatus:"accepted"}).populate("userId")
    console.log(bookings);
    res.render("BookedUsers",{ride,bookings,userId,isLoggedIn:req.isLoggedIn,username:req.username });
  }catch(err){
    console.error(err);
    res.status(500).send("Server error");
  }
};


exports.getMyBookingRequests=async (req,res)=>{
  try {
    const bookings=await Booking.find({userId:req.userId })
      .populate("rideId")
    res.render("myReq",{bookings});
  } catch(error){
    console.error(error);
    res.status(500).send("Server error");
  }
};

