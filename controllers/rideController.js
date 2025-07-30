const Ride = require('../Models/Ride');
const Booking = require('../Models/Booking');
const User=require("../Models/User")
const Notification=require("../Models/Notification")

exports.renderRideForm=(req,res)=>{res.render('ride', { isLoggedIn:req.isLoggedIn,username:req.username });};

exports.createRide = async(req,res)=>{
try {
    const { location, destination,date,pickupPoint,dropoffPoint, pickupTime,seats,price,returnTrip,returnTripDone,later,pickupLat,pickupLng,dropLat,dropLng}= req.body;   

    if(!location||!destination ||!date ||!pickupPoint||!dropoffPoint||!pickupTime ||!seats||!price) { return res.status(400).send("Incomplete ride details");}

   //  console.log(pickupTime)
     //console.log(new Date().toISOString().slice(11,16))
     
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if(!pickupTime || !timeRegex.test(pickupTime)){return res.status(400).send("Invalid pickup time format");}

     const min =new Date().toISOString().slice(0,10);
    if(date<min){return res.status(400).send("The date has already passed"); }

    if (isNaN(price)|| price<=0) {return res.status(400).send("Invalid price. Must be a number greater than 0");}

    if(seats<1){return res.status(400).send('Passengers must be at least 1'); }

    const ride=new Ride({
        publisher: req.userId,
        location, destination,date,pickupTime,seats,price,
            returnTrip:returnTrip=== 'on',
           returnTripDone:returnTripDone==='on',
            later: later==='on',
           pickup: {point: pickupPoint,lat: pickupLat,lng: pickupLng},
          dropoff: { point: dropoffPoint, lat: dropLat, lng: dropLng}
        });
        await ride.save();
      res.redirect("/search")
    }catch(err){ console.error(err);
        res.status(500).send('Error creating ride'); }
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

    if((bookingFor==="")) { return res.status(400).json({ error: "You need to select one option" }); }
    if((bookingFor==="myself" && (!passengerName||!passengersNo ||!phoneNumber))||(bookingFor ==="other" && (!otherPassengerName||!passengerEmail||!no||!phoneNo))) {
      return res.status(400).json({ error: "Booking details incomplete" });
    }
   if(bookingFor==="other"){ const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(passengerEmail))  return res.status(400).json({ error: "Invalid email format" });
   }
    const ride=await Ride.findById(rideId).populate("bookings");
    if(!ride) return res.status(404).json({ error: "Ride not found" });

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
if (bookingFor === 'myself') {
  const user = await User.findById(req.userId).select("email");
  if (!user) return res.status(404).json({ error: "User not found" });
  email = user.email;
} else {
  email = passengerEmail;
}

    if(bookingFor==='other') {
       const user=await User.findOne({email:passengerEmail });
       if(user){ bookedForUserId = user._id;}
    }else {bookedForUserId = req.userId;}

    const booking =new Booking({rideId,bookingFor, count: seatCount,
      username: req.username,
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
res.status(200).json({ message: "Request sent" });

const io=req.app.get('io');
const userSockets=io.userSockets;
const publisherId=ride.publisher.toString();
const publisherSocket=userSockets[publisherId];

const newNotification={ user:publisherId,rideId:ride._id,
  message:`New booking request from ${booking.name}` };

if(publisherSocket){ console.log("Sending message to:",publisherId);
  publisherSocket.emit('newBookingRequest',newNotification);
}
await Notification.create(newNotification);

  }catch(err){
    console.error(err);
    res.status(500).json({ error:"server err" });
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
    const notifications=await Notification.find({ user:req.userId,isRead:false})

    res.render('publishedRides',{rides,notifications,isLoggedIn: req.isLoggedIn,username: req.username,userId:req.userId  });
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
  console.log(ride);

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
    await Notification.findOneAndUpdate({bookingId:booking._id},{isRead:true});
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
    await Notification.findOneAndUpdate({bookingId: booking._id}, {isRead: true });

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


