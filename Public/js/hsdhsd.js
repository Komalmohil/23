
const Message = require('../../models/Message'); 
exports.getInbox = async (req, res) => {
  try {
    const rideId = req.params.rideId;
    const userId = req.userId;
    console.log("rideId:", rideId);
console.log("userId:", userId);


    if (!rideId || !userId) {
      console.log("Missing rideId or userId:", rideId, userId);
      return res.status(400).send("Invalid request");
    }

    // Fetch messages related to this ride
    const messages = await Message.find({ rideId }).sort({ createdAt: 1 });
console.log("messages:", messages);
    res.render("inbox", {
      rideId,
      userId,
      messages,
      isLoggedIn: req.isLoggedIn,
      username: req.username,
    });

  } catch (err) {
    console.error("Chat room error:", err);
    res.status(500).send("Server error");
  }
};

exports.showInbox = async (req, res) => {
  try {
    const userId = req.userId;

    // Get rides where user is publisher
    const publishedRides = await Ride.find({ publisher: userId });

    // Get rides where user has booked
    const bookings = await Booking.find({
      $or: [
        { userId: userId },
        { bookedForUserId: userId }
      ],
      bookingStatus: "accepted"
    }).populate('rideId');

    // Extract unique rides from bookings
    const bookedRides = bookings
      .map(b => b.rideId)
      .filter((ride, index, self) => ride && self.findIndex(r => r._id.toString() === ride._id.toString()) === index);

    res.render('allInbox', {
      publishedRides,
      bookedRides,
      userId,
      isLoggedIn: req.isLoggedIn,
      username: req.username
    });

  } catch (err) {
    console.error("Error in showInbox:", err);
    res.status(500).send("Failed to load inbox");
  }
};



const userSockets = {}; 

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('registerUser', (userId) => {
      if (userId) {
        socket.userId = userId;
        userSockets[userId] = socket;
        console.log(`Socket ${socket.id} registered for user ${socket.userId}`);
        socket.emit("registrationSuccess", { message: "Registered successfully" });
      } else {
        socket.emit("registrationError", { error: "Missing userId" });
      }
    });

    socket.on("joinRoom", roomId => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on("privateMessage", ({ roomId, senderId, message }) => {
      io.to(roomId).emit("privateMessage", { senderId, message });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && userSockets[socket.userId]) {
        delete userSockets[socket.userId];
        console.log(`Unregistered user ${socket.userId} on disconnect`);
      }
    });
  });

  io.userSockets = userSockets; 
};


exports.showUserInbox = async (req, res) => {
  const userId = req.userId;

  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).populate("sender receiver rideId");

    const chatMap = new Map();

    for (let msg of messages) {
      const otherUser =
        msg.sender._id.toString() === userId
          ? msg.receiver
          : msg.sender;

      const key = `${otherUser._id}_${msg.rideId._id}`;
      if (!chatMap.has(key)) {
        chatMap.set(key, {
          user: otherUser,
          ride: msg.rideId,
          lastMessage: msg.text,
          lastTime: msg.timestamp
        });
      } else {
        // Keep the latest message
        if (msg.timestamp > chatMap.get(key).lastTime) {
          chatMap.get(key).lastMessage = msg.text;
          chatMap.get(key).lastTime = msg.timestamp;
        }
      }
    }

    const conversations = Array.from(chatMap.values());

    res.render("inboxList", {
      conversations,
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading inbox");
  }
};
 