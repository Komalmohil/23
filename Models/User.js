const mongoose=require('mongoose');

const userSchema =new mongoose.Schema({
  username:{type:String,required: true  },  
  password: {type:String,required: true  },  
  email: {type:String,required: true  },  
  phone:{type:Number,required: true  },  
  resetToken:{type:String, default:"" },  
//   otp: {type:String, default:"" },
// otpExpires: {type:Date, default:"" },
});

module.exports = mongoose.model('User', userSchema);
