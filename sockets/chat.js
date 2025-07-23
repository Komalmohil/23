const { Server } = require("socket.io");
const Message = require("./Models/Message");

const io = new Server(server, {
  cors: { origin: "*"}
});

const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("registerUser", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("chatMessage", async (data) => {
    const { sender, receiver, text, rideId } = data;

    const message = new Message({ sender, receiver, text, rideId });
    await message.save();

    const roomId = [sender, receiver].sort().join("_");
    io.to(roomId).emit("chatMessage", message);
  });

  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});




const Message = require('./models/Message'); // Make sure this path is correct

const userSockets = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user
    socket.on('registerUser', (userId) => {
      if (userId) {
        socket.userId = userId;
        userSockets[userId] = socket;
        console.log(`Socket ${socket.id} registered for user ${userId}`);
      }
    });

    // Join room
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room: ${roomId}`);
    });

    // Handle chat message
    socket.on('privateMessage', async ({ roomId, senderId, receiverId, message, rideId }) => {
      try {
        // Save message to DB
        const newMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          text: message,
          rideId,
        });
        await newMessage.save();

        // Broadcast to room
        io.to(roomId).emit('privateMessage', {
          senderId,
          message,
        });

        console.log(`Message sent in room ${roomId} by ${senderId}`);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const userId in userSockets) {
        if (userSockets[userId] === socket) {
          delete userSockets[userId];
          break;
        }
      }
    });
  });

  io.userSockets = userSockets;
};





module.exports=(io)=>{
const users={};
io.on("connection",(socket)=>{    //connection event -making a circuit - will have individual sockect
   console.log("a user connected");             //when ever clients enters
    console.log("Socket id",socket.id)

    socket.emit("connected") ///connected is event name  //to all

    socket.emit("welcome",`Welcome ${socket.id}`)  //to oneself
    
    socket.broadcast.emit("others",`other ${socket.id}`)
    
   socket.emit("end");

    socket.on("disconnect",()=>{
        console.log(`User disconnected ${socket.id}`)
    })


    socket.on("msg",({msg,room})=>{    //receiving message
    console.log("msg received:",msg);  
   // io.emit("allmsg",msg);   //sending to all again
   // socket.broadcast.emit("othermsg",msg)   //to others except sender

   io.to(room).emit("prsnl",msg);//1-1

  
});
socket.on("joinRoom",(roomName)=>{
  socket.join(roomName);   // makes a room
  console.log(`User ${socket.id} joined room: ${roomName}`);  // name users that joined the room

 socket.emit("welcome", `Welcome to room: ${roomName}`);
 socket.to(roomName).emit("others", `User ${socket.id} has joined the room`);
  
});

socket.on("new",name=>{
    console.log("new user",name);
    users[socket.id]=name;
    socket.broadcast.emit('user-joined',name)
})
  








});
}