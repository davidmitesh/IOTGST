const express=                require('express'),
      passport=               require('passport'),
      bodyParser=             require('body-parser'),
      passportLocalMongoose=  require('passport-local-mongoose'),
      localStrategy=          require('passport-local'),
      mongoose=               require('./server/db/mongoose.js'),
      user=                   require('./server/models/user.js');
      const _=require('lodash');
      const axios=require('axios');
    const   enAddressUrl='http://admin:admin@35.200.173.47/api/positions';

      let {school}= require('./server/models/schools.js');
var path = require("path");
var app=express();
app.use(require('express-session')({
 secret: "hey you,yes you!",
 resave:false,
 saveUninitialized:false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
 app.set('viewengine','ejs');
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());



//------------
//Routes
//------------
app.get('/',isLoggedIn,(req,res)=>{
  res.render('menupage.ejs');
});

app.get('/secret',isLoggedIn,(req,res)=>{
  res.render('secret.ejs');
});

//---------
//Auth-routes--
//------
//show signup form
app.get('/register',(req,res)=>{
  res.render('register.ejs');
});
//add post method to signup
app.post('/signup',(req,res)=>{
console.log(req.body);
  user.register(new user({username: req.body.username}),req.body.password,function(err,result){
    if (err){
      console.log(err);
      return res.render('register.ejs');
    }
    passport.authenticate('local')(req,res,function(){
      console.log('hey');
      res.redirect('/menupage');
    });
  });
});
//Login Routes
app.get('/loginpage',(req,res)=>{
  res.render('login.ejs');
});

app.post('/login',passport.authenticate('local',{
  successRedirect:"/menupage",
  failureRedirect:"/loginpage"
}),(req,res)=>{

});

app.get('/logout',(req,res)=>{
  req.logout();
  res.redirect('/');
});

function isLoggedIn(req,res,next){
  if (req.isAuthenticated()){
    return next();
  }else {
    res.redirect('/loginpage');
  }
};
// ROUTE to load the addschool page
app.get('/addschoolpage',isLoggedIn,(req,res)=>{
  res.render('addschool.ejs');
});
app.get('/menupage',(req,res)=>{
  res.render('menupage.ejs');
});
app.post('/addSchool',isLoggedIn,(req,res)=>{
  var body=_.pick(req.body,['name','username','address','password']);
  var newSchool=new school({name:body.name,password:body.password,username:body.username,address:body.address,parents:[],buses:[]
});
// newSchool.parents.push({mobileNumber:2222,parentName:'ganga',childName:'sita'});
newSchool.save((err,doc)=>{

  console.log("succed");
  res.redirect('/menupage');
});
});
app.get('/schoolloginpage',(req,res)=>{
  res.render('schoolloginpage.ejs');
});
app.post('/schoollogin',(req,res)=>{
  var body=_.pick(req.body,['username','password']);
  school.findByCredentials(body.username,body.password).then((user)=>{
    res.render('schooldashboard.ejs');
  }).catch((e)=>{
    res.status(400).send();
  });
});


app.get('/addparentpage',(req,res)=>{
  res.render('addparentpage.ejs');
});//
app.post('/addParent',(req,res)=>{
  var body=_.pick(req.body,['mobilenumber','childname','parentname','schoolname','busnumber']);
  console.log(body);
  school.findOne({name:body.schoolname},(err,doc)=>{
    doc.parents.push({mobileNumber:body.mobilenumber,parentName:body.parentname,children:{childName:body.childname,busNumber:body.busnumber}});
    // doc.parents.children.push({childName:body.childname,busNumber:body.busnumber});
    school.findOneAndUpdate({name:body.schoolname},doc,()=>{
      console.log("successfully updated");
        res.redirect('/menupage');
    });
  });
});
app.get('/addBuspage',(req,res)=>{
res.render('addbus.ejs');
});
//------------------------
//associate a deviceId with the busNumber provided the school name
//--------------------------
app.post('/busNumberWithDevice',(req,res)=>{
  var body=_.pick(req.body,['deviceid','busnumber','schoolname']);
  // school.find({buses.deviceId:deviceId,'buses.busNumber':busNumber}).then((result)=>{
  //   if (!_.size(result)){
  //     res.status(400).send('Bus number with the selected device id is already assigned');
  //   }
    school.findOne({name:body.schoolname}).then((doc)=>{
      doc.buses.push({busNumber:body.busnumber,deviceId:body.deviceid});
      school.findOneAndUpdate({name:body.schoolname},doc,(err,result)=>{
        res.send("succesfully updated");
      });
    });
  // });

});
//------------------
//Get all info about which device Id is matched with which busnumber of particular schools
//------------------
app.get('/getAllDevicesState',(req,res)=>{
  var result=[];
  var livedevices=[];
  school.find({service:"GST"}).then((docs)=>{
    _.forEach(docs,function(school){
      _.forEach(school.buses,function(bus){
        result.push({name:school.name,busno:bus.busNumber,deviceId:bus.deviceId});
        livedevices.push(bus.deviceId);
      });
    });
    axios.get(enAddressUrl).then((response)=>{
      var allDevices=response.data;
      _.forEach(allDevices,function(device){
        if (!(_.includes(livedevices,device.deviceId))) {
          result.push({name:null,busno:0,deviceId:device.deviceId});
        }
      });
      res.send(result);
    });
  });

});

app.get('/mappage',(req,res)=>{
  res.render('map.ejs');
});
app.listen(3000,()=>{
  console.log("server is up");
});
