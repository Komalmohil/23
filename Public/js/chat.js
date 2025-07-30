module.exports=(io)=>{

const users={};

io.on("connection",(socket)=>{
  socket.on("new",name=>{
    console.log("new user",name);
    users[socket.id]=name;
    socket.broadcast.emit('user-joined',name)
 })
  
 socket.on("send",msg=>{
    socket.broadcast.emit('received',{msg:msg,name:users[socket.id]})
 })


})
}
