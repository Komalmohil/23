const User= require('../Models/User');
const jwt= require('jsonwebtoken');
const bcrypt =require('bcrypt');
const sendMail= require('../Middleware/sendMail');
const Otp = require('../Models/Otp');
const Driver= require('../Models/Driver');
const { v4:uuidv4 }= require('uuid');

exports.Home=(req,res)=>{ res.render('home', {isLoggedIn:false||req.isLoggedIn, username:null||req.username,userId: req.userId||null });};

exports.Login= (req,res)=>{ res.render('login');};

exports.EmailLogin=(req,res)=>{res.render('email', {isLoggedIn:false,username:null});};

exports.loginWithEmail =async(req,res)=>{
  const {email,password}=req.body;
  if(!email||!password){ res.send("incomplete details")}
  
  const user= await User.findOne({email});
  if (!user) return res.send("Invalid user details");
  
  const isMatch=await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Invalid user details");

  const token=jwt.sign({ id: user._id,username: user.username },process.env.secretKey,{expiresIn:'1d'});
  res.cookie('token',token,{ httpOnly: true,maxAge:10000000 }); 
   return res.render('home', { isLoggedIn: true, username: user.username });

};

exports.checkEmail=async (req,res)=>{
  const {email} =req.body;
  if(!email){ return res.send("incomplete details")}

  try {
    const emailRegex=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email))  return res.status(400).json({error:"Invalid email format"});
    const existingUser =await User.findOne({email});
    if(existingUser) return res.status(400).json({ error:"User already exists"});
 
     const otp=`${Math.floor((Math.random()*9000)+1000)}`; 
    const otpExpires =Date.now()+5*60*1000; 
    console.log(otp);
    await Otp.create({email,otp,otpExpires});
     
    const result=await sendMail({
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is <b>${otp}</b></p>`,
    });
    if (!result.success){  console.log("otp  not sent");
      return res.status(500).json({error:"Failed to send OTP" });}
    
      res.json({success:true});
  } catch (err) {
    console.error("check err:",err);
    res.status(500).json({ error:"Server error"});
  }
};

exports.verifyOtp = async (req, res) => {
  const {email,otp}=req.body;
  if(!email||!otp) { return res.status(400).json({error:"Incomplete details" });}
  try {
    const otpSaved=await Otp.findOne({ email});
    if(!otpSaved||otpSaved.otp !==otp||otpSaved.otpExpires<Date.now()) {return res.status(400).json({error:"Invalid or expired OTP" }); }
     await Otp.deleteOne({email});
    res.json({success:true });
     
  } catch (err) {
    console.error("OTP error:",err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.renderSignup=(req,res)=>{ res.render("signup"); };

exports.signup=async (req,res)=>{
  try {
    const { name, email,password,phone,isDriver, carModel,licenseNumber,seatCapacity}=req.body;
     console.log("email",email)
    if(!name||!email||!password||!phone){  return res.status(400).json({error:"incomplete details"})}

    const existingUser= await User.findOne({ email });
    if(existingUser) return res.status(400).json({error:"User already exists"});
    
    if (!/^\d{10}$/.test(Number(phone))) {
   return res.status(400).json({error:"Phone number must be exactly 10 digits"});
   }

    const hashedPassword= await bcrypt.hash(password,10);
    const user=new User({ username: name,email,password:hashedPassword,phone,  isDriver });
    await user.save();
    
    console.log("driver radio",isDriver,typeof(isDriver))

    if(isDriver==='true') {
 if(!carModel||!licenseNumber||!seatCapacity){  return res.status(400).json({error:"incomplete details"})}
     const driver= new Driver({user: user._id, carModel,licenseNumber,seatCapacity});
      await driver.save();
}


    const token=jwt.sign({id: user._id,username: user.username},process.env.secretKey,{ expiresIn: '1d' });
    res.cookie('token', token,{httpOnly: true,maxAge:100000000 });
    res.render("home",{isLoggedIn: true, username:user.username });
  } catch(err){
    console.error(err);
    res.status(500).send("Signup failed");
  }
};

exports.renderForget=(req,res)=>{ res.render('forget'); };

exports.sendResetLink=async (req,res)=>{
  const {email}=req.body;
  if(!email){ res.send("incomplete details")}
  const user=await User.findOne({email});
  user.resetToken=uuidv4();
  console.log("sent token",user.resetToken);
  await user.save();
  const resetLink= `http://localhost:${process.env.port}/forgot/${user.resetToken}`;
  const result=await sendMail({
    to:email,
    subject: 'Reset Password Link',
    html:`<p>Click to reset your password:</p><a href="${resetLink}">Reset Password</a>`
  });

  if(result.success){res.render("login"); } 
  else { res.send("Failed to send email.");}
};

exports.renderReset =async (req,res)=>{
  const {token}=req.params;
  console.log("reset token",token);
  const user=await User.findOne({resetToken:token});
  if(!user){ console.log("No user found with token");
    return res.send("Invalid token");
  }
  console.log("User",user.email);
  res.render('reset',{token});
};

exports.resetPassword= async (req,res)=>{
  const {pass,confirmPass,token}=req.body;
  if(!pass||!confirmPass){ res.send("incomplete details")}
  console.log("Reset form",token);

  if(pass!==confirmPass) return res.send("Passwords do not match");

  const user= await User.findOne({resetToken:token});
  if (!user) {
    console.log("Invaild token");
    return res.send("Invail token");
  }
  console.log("Resetting",user.email);

  user.password =await bcrypt.hash(pass,10);
  user.resetToken= undefined;
  await user.save();

  res.render("email", {isLoggedIn:false,username:null });
};

exports.logout=(req,res)=>{
  res.clearCookie('token');
  res.redirect('/login');
};