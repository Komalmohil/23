const express= require('express');
const router= express.Router();
const verifyToken= require('../Middleware/verifyToken'); 
const auth =require('../Middleware/authRoute');

const {Home,Login,EmailLogin,loginWithEmail,checkEmail, 
  renderSignup,signup,verifyOtp,renderForget,sendResetLink,renderReset,resetPassword,logout} = require('../controllers/authController');

router.get('/',auth,Home);
router.get('/login',Login);
router.get('/login/email',EmailLogin);
router.post('/login/email',loginWithEmail);
router.post('/check-email',checkEmail);
router.post("/verify-otp", verifyOtp);

router.get('/signup',renderSignup);
router.post('/signup',signup);

router.get('/forget',renderForget);
router.post('/forget',sendResetLink);

router.get('/forgot/:token', renderReset);
router.post('/reset/:token',resetPassword);

router.get('/logout',logout);

module.exports= router;