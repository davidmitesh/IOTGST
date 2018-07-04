const mongoose=require('mongoose');
const _=require('lodash');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const passportLocalMongoose=require('passport-local-mongoose');

var busSchema=new mongoose.Schema({
  busNumber:{
    type:Number
  }
});
var parentSchema=new mongoose.Schema({
  mobileNumber:{
    type:Number
  },
  parentName:{
    type:String
  },
  childName:{
    type:String
  },
  busNumber:{
    type:Number
  }
});

var schoolSchema=new mongoose.Schema({

  name:{
    type:String
  },
  password:{
    type:String
  },
  username:{
    type:String
  },
  address:{
    type:String
  },
  parents:[parentSchema],
  buses:[busSchema]
});


schoolSchema.methods.saveRecord=function(){
  var user=this;
return   user.save().then((doc)=>{
    return doc;
  },(err)=>{
    return err;
  });
};
schoolSchema.pre('save',function(next){  //this middleware runs prior to every save function of userSchema instance.
  if (this.isModified('password')){//only hashes the password if the password is modified ,for other operation
    //no hashing is done to avoid multiple hashing of passwords
    bcrypt.genSalt(10,(err,salt)=>{
      bcrypt.hash(this.password,salt,(err,hash)=>{
        this.password=hash;
        next();
      });
    });
  }else{
    next();
  }
});
schoolSchema.statics.findByCredentials=function(username,password){

  return this.findOne({username}).then((user)=>{
    if (!user){
      return Promise.reject();
    }
    return new Promise((resolve,reject)=>{
      bcrypt.compare(password,user.password,(err,result)=>{
        if (result){
          resolve(user);
        }else{
          reject();
        }
      });
    });
  });
}

var school=mongoose.model('school',schoolSchema);

module.exports={school}
