const Message = require("../Models/Message");
const User = require("../Models/User");
const Notification=require("../Models/Notification")
const userSockets = {};

module.exports=(io)=>{
  io.on("connection",(socket)=>{
    console.log(`Socket connected: ${socket.id}`);

    socket.on("registerUser",(userId)=>{
      if(userId){
        socket.userId=userId;
        userSockets[userId] = socket;
        console.log(`Socket ${socket.id} registered for user ${userId}`);
      }
    });

    socket.on("joinRoom",(roomId)=>{
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("sendMessage", async(data)=> {
      const { text,sender,receiver,rideId}=data;
      console.log("Message received:",data);
      const senderId=sender;
      const receiverId=receiver;
      const roomId=[senderId, receiverId,rideId].sort().join("_");

      try {
        const message=await Message.create({text,sender,receiver,rideId });

        io.to(roomId).emit("newMessage",message);
      
        const senderUser=await User.findById(senderId).select("username");
        const senderName=senderUser?.username||"Someone";

        await Notification.create({user: receiverId,message: `New message from ${senderName}`,rideId,roomId,isRead: false});
        
        const receiverSocket=userSockets[receiverId];
        if(receiverSocket){
          console.log("Sending notification to receiver:",receiverId);
          receiverSocket.emit("newChatNotification", {
            message: `New message from ${senderName}`,
            rideId,roomId,sender:senderId,receiver:receiverId
          });
        }
      } catch(err){  console.error("Message not stored:", err); }
    });



    // socket.on("send-loc",async(data)=>{
    //    io.emit("receive-loc",{})
    // }



    socket.on("disconnect",()=>{
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && userSockets[socket.userId] === socket) {
        delete userSockets[socket.userId];
      }
    });
  });

  io.userSockets = userSockets;
};
