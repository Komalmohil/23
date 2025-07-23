const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports= function (req, res, next) {
  const token= req.cookies.token;
  if (!token){
    req.isLoggedIn = false;
    req.username = null;
    return next();
  }
  try {
    const decoded =jwt.verify(token, process.env.secretKey);
    req.userId =decoded.id;
    req.username= decoded.username;
    req.isLoggedIn= true;
  }catch(err){
    req.isLoggedIn = false;
    req.username= null;
  }
  next();
};
