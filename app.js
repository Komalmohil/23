const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');   
require('dotenv').config();
const notification= require("./sockets/socket")
const cookieParser = require('cookie-parser');


const app = express();
const server =createServer(app)
const io= new Server(server)   //creating circuit
app.set('io', io);
notification(io)

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');

mongoose.connect('mongodb://localhost:27017/blabla')
.then(()=>{
    console.log("connected to db")
    server.listen(3000, () => console.log(`Server is running`))   //because app.listen creats a different instance
})
.catch((err)=>{console.log("Server err")})

app.use((req,res,next)=>{
  res.locals.userId=req.userId || null;
  res.locals.username=req.username || null;
  res.locals.isLoggedIn=req.isLoggedIn || false;
  next();
});


const authRoute=require('./routes/auth');
app.use('/',authRoute);

const rideRoutes= require('./routes/ride');
app.use('/',rideRoutes);

const userRoutes=require('./routes/personalized');
app.use('/',userRoutes);



