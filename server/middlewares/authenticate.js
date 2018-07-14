
let {school}=require('./../models/schools.js');

var authenticate=(req,res,next)=>{
  var token=req.authheader;
  school.findByToken(token).then((user)=>{
    if (!user){
      return Promise.reject();
    }
  req.user=user;
  req.token=token;
  next();
  }).catch((e)=>{
    res.status(401).send("hey theres error");
  });
}

module.exports={authenticate};
