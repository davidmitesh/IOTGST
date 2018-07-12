const mongoose=require('mongoose');
const _=require('lodash');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const passportLocalMongoose=require('passport-local-mongoose');

var busSchema=new mongoose.Schema({
  busNumber:{
    type:String,
	default:"0"
  },
  deviceId:{
    type:Number
  }
});
var childSchema=new mongoose.Schema({
  childName:{
    type:String
  },
  busNumber:{
    type:String,
	default:"0"
  }
});
var notificationSchema=new mongoose.Schema({
  text:{
    type:String
  },
  seen:{
    type:Boolean,
    default:false
  }
});
var parentSchema=new mongoose.Schema({
  mobileNumber:{
    type:Number
  },
  parentName:{
    type:String
  },
  address:{
    type:String
  },
  emailAddress:{
    type:String
  },
  children:[childSchema]
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
  emailAddress:{
    type:String
  },
  contactNumber:{
    type:Number
  },
  service:{
    type:String,
    default:"GST"
  },
  childrenNumber:{
    type:Number,
    default:0
  },

  parents:[parentSchema],
  buses:[busSchema],
  parentnotification:[notificationSchema],
  schoolnotification:[notificationSchema]
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
var notification=mongoose.model('notification',notificationSchema);
schoolSchema.methods.addParentNotice=function(text){
  var docs=this.parentnotification;
  docs.push({text,seen:false});
  this.set('parentnotification',docs);
  this.save();
};
schoolSchema.statics.addSchoolNotice=function(text,schools){
  var newnotification=new notification({text:text});
  var user=this;
  console.log(schools);
  _.forEach(schools,function(school){
   // console.log(school);
    user.findOneAndUpdate({name:school},{$push:{schoolnotification:newnotification}},(err,result)=>{

    });
  });
  return 1;
};

schoolSchema.statics.addParentNotice=function(text,schools){
  var newnotification=new notification({text:text});
  var user=this;
  console.log(schools);
  _.forEach(schools,function(school){
   // console.log(school);
    user.findOneAndUpdate({name:school},{$push:{parentnotification:newnotification}},(err,result)=>{

    });
  });
  return 1;
}
schoolSchema.statics.removeSchool=function(schoolName){
  return this.findOneAndDelete({name:schoolName},(err,result)=>{
    return 1;
  });
}
schoolSchema.statics.modifySchool=function(schoolName,modifiedSchool){
  return this.findOneAndUpdate({name:schoolName},modifiedSchool,(err,result)=>{
    return 1;
  });
};
schoolSchema.statics.removeParent=function(mobileNumber,schoolName){
  return this.findOneAndUpdate({name:schoolName},{$pull:{parents:{mobileNumber}}},(err,result)=>{
    return 1;
  });
};


schoolSchema.statics.modifyParent=function(mobileNumber,schoolName,details){

    /*this.findOneAndUpdate({name:schoolName},{$push:{parents:details}},(err,result)=>{
      return 1;
    });*/
	this.findOne({name:schoolName},(err,result)=>{
	  let ind;
	  let m=JSON.parse(JSON.stringify(result.parents));
	  for(let i=0;i<m.length;i++){
	     if(m[i].mobileNumber.toString()==mobileNumber.toString()){
		   ind=i;
		   break;
		 }
	  }
	  console.log(m[ind]['mobileNumber']);
	  /*this.findOne({"parents.mobileNumber":Number(m[ind]['mobileNumber'])},(err,result)=>{
	     console.log(result);
	  });*/
	  console.log(details);
	  /*result.parents.findOne({mobileNumber:mobileNumber},(err,result)=>{
	    console.log(result);
	  });*/
	});

};


schoolSchema.statics.unassignbus=function(busNumber,schoolName,details){
   return this.findOneAndUpdate({name:schoolName},{$pull:{buses:{busNumber:busNumber}}},(err,result)=>{
       return 1;
   });
}

var school=mongoose.model('school',schoolSchema);
var child=mongoose.model('child',childSchema);
var parent=mongoose.model('parent',parentSchema);

module.exports={school,child,parent}
