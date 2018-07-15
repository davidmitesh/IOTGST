let {school}=require('./../models/schools.js');

let authenticate=(req,res,next)=>{
  let token=req.authheader;
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