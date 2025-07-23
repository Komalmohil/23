const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports= function (req, res, next) {
  const token=req.cookies.token;

  if (!token){ return res.status(401).send("Unauthorized - Login required to access"); }

  try {
    const decoded= jwt.verify(token, process.env.secretKey);
    req.userId =decoded.id;
    req.username= decoded.username;
    req.isLoggedIn= true;
    next();
  } catch(err){
    console.log("JWT err", err.message);
    return res.status(401).send("Unauthorized - Invalid or expired token");
  }
};