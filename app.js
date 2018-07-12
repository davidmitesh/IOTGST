let filePath;
const express=                require('express'),
      passport=               require('passport'),
      bodyParser=             require('body-parser'),
      passportLocalMongoose=  require('passport-local-mongoose'),
      localStrategy=          require('passport-local'),
      mongoose=               require('./server/db/mongoose.js'),
      user=                   require('./server/models/user.js'),
      _=require('lodash'),
      axios=require('axios');
     const   enAddressUrl='http://admin:admin@35.200.251.179/api/positions';

let {school}= require('./server/models/schools.js');
let path = require("path");
let cors=require('cors');
let jsonexport = require('jsonexport');
let fs=require('fs');
let app=express();
app.use(function (req, res, next){
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.redirect('http://' + req.hostname + req.url);
  } else {
    next();
  }
});
app.use(cors());
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


//---------
//Auth-routes--
//------
//show signup form
app.get('/register',(req,res)=>{
  res.render('register.ejs');
});
//add post method to signup
app.post('/signup',(req,res)=>{
//console.log(req.body);
  user.register(new user({username: req.body.username}),req.body.password,function(err,result){
    if (err){
      //console.log(err);
      return res.render('register.ejs');
    }
    passport.authenticate('local')(req,res,function(){
      //console.log('hey');
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
//------------------
//middleware to count number of records in the database i.e number of children,schools,parents,buses
//-------------
function countDetails(req,res,next){
  var c=0,
      b=0,
      p=0,
      s=0,
      schoolchildnumber=[];
  school.find({service:'GST'},(err,schools)=>{
    //console.log(schools);
    _.map(schools,function(school){
      c+=school.childrenNumber;
      b+=school.buses.length;
      p+=school.parents.length;
      s+=1;
    });
    var countRecord={children:c,buses:b,parents:p,schoolno:s};
    req.count=countRecord;
    next();
  });
};
function devicestates(req,res,next){
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
      req.result=result;
      next();
    });
  });
}
//---------------------------------------------------------
//middleware that returns the total schools array--
//----------------
function getSchools(req,res,next){
  school.find({service:'GST'},(err,schools)=>{
    req.schools=schools;
    next();
  });
};
// ROUTE to load the addschool page
app.get('/addschoolpage',isLoggedIn,(req,res)=>{
  res.render('addschool.ejs');
});
app.get('/menupage',getSchools,countDetails,devicestates,(req,res)=>{
  res.render('maindashboard.ejs',{schools:req.schools,children:req.count.children,buses:req.count.buses,parents:req.count.parents,schoolno:req.count.schoolno,result:req.result});
});
app.post('/addSchool',isLoggedIn,(req,res)=>{
  let body=_.pick(req.body,['name','username','address','password','number','email']);
  let newSchool=new school({name:body.name,password:body.password,username:body.username,address:body.address,contactNumber:body.number,emailAddress:body.email,parents:[],buses:[]
});
// newSchool.parents.push({mobileNumber:2222,parentName:'ganga',childName:'sita'});
newSchool.save((err,doc)=>{

  //console.log("succed");
  res.redirect('/menupage');
});
});
app.get('/schoolloginpage',(req,res)=>{
  res.render('schoolloginpage.ejs');
});
app.post('/schoollogin',(req,res)=>{
  let body=_.pick(req.body,['username','password']);
  school.findByCredentials(body.username,body.password).then((user)=>{
    res.render('schooldashboard.ejs');
  }).catch((e)=>{
    res.status(400).send();
  });
});


app.post("/csv",(req,res)=>{
   filePath=__dirname+"/public/data/report.csv";
   jsonexport(JSON.parse(req.body["data"]),function(err, csv){
    fs.writeFile(filePath,csv, function (err) {
       res.send(JSON.stringify({status:"OK"}));
    });
  });
});


app.get('/addparentpage',(req,res)=>{
  res.render('addparentpage.ejs');
});//
app.post('/addParent',(req,res)=>{
  var body=_.pick(req.body,['mobilenumber','childname','parentname','schoolname','busnumber','address','email']);
  school.findOne({name:body.schoolname},(err,doc)=>{
    doc.parents.push({mobileNumber:body.mobilenumber,parentName:body.parentname,address:body.address,emailAddress:body.email,children:{childName:body.childname,busNumber:body.busnumber}});
    doc.childrenNumber+=1;
    school.findOneAndUpdate({name:body.schoolname},doc,()=>{
      //console.log("successfully updated");
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
  let body=_.pick(req.body,['deviceid','busnumber','schoolname']);
  // school.find({buses.deviceId:deviceId,'buses.busNumber':busNumber}).then((result)=>{
  //   if (!_.size(result)){
  //     res.status(400).send('Bus number with the selected device id is already assigned');
  //   }
    school.findOne({name:body.schoolname}).then((doc)=>{
      doc.buses.push({busNumber:body.busnumber,deviceId:body.deviceid});
      school.findOneAndUpdate({name:body.schoolname},doc,(err,result)=>{
        res.redirect('/menupage');
      });
    });
  // });

});
//------------------
//Get all info about which device Id is matched with which busnumber of particular schools
//------------------
app.get('/getAllDevicesState',(req,res)=>{
  let result=[];
  let livedevices=[];
  school.find({service:"GST"}).then((docs)=>{
    _.forEach(docs,function(school){
      _.forEach(school.buses,function(bus){
        result.push({name:school.name,busno:bus.busNumber,deviceId:bus.deviceId});
        livedevices.push(bus.deviceId);
      });
    });
    axios.get(enAddressUrl).then((response)=>{
      let allDevices=response.data;
      _.forEach(allDevices,function(device){
        if (!(_.includes(livedevices,device.deviceId))) {
          result.push({name:null,busno:0,deviceId:device.deviceId});
        }
      });
      res.send(result);
    });
  });
});
//--------------------------------
//Notification section---
//--------------------------------
//route for opening the notification page for school and school
app.get('/formpage',(req,res)=>{
  res.render('multipleformpage.ejs');
});
//adding school notification
app.post('/sendSchoolNotification',(req,res)=>{
  if (school.addSchoolNotice(req.body.text,req.body.schools)){
    res.send('added notice');
  };
});
//adding parent notification
app.post('/sendParentNotification',(req,res)=>{
  if (school.addParentNotice(req.body.text,req.body.schools)){
    res.send('added notice');
  };
});
//fetching school notification
app.get('/getSchoolNotification',(req,res)=>{

});

//---------------------------
//routes for modifying school and parents
//--------------------
//----for schools
app.post('/modifySchool',(req,res)=>{
  if (req.body.password==null){
    var body=_.pick(req.body,['name','username','address','emailAddress','contactNumber']);
  }else{
	  var body=_.pick(req.body,['name','password','username','address','emailAddress','contactNumber']);
  }
  if (school.modifySchool(body.name,body)){
    res.redirect('/menupage');
  }
});
app.post('/deleteSchool',(req,res)=>{
   if (school.removeSchool(req.body.schoolname)){
     res.redirect('/menupage');
   }
});
//--------for parents
app.post('/modifyParent',(req,res)=>{
  
  var body=_.pick(req.body,['mobilenumber','parentname','address','email','childname','busnumber','schoolname']);
  //console.log(body);
  /*if (school.modifyParent(body.mobileNumber,body.schoolname,body)){
    res.redirect('/menupage');
  }*/
  let body1={},num;
  body1["mobileNumber"]=body["mobilenumber"];
  body1["parentName"]=body["parentname"];
  body1["address"]=body["address"];
  body1["emailAddress"]=body["email"];
  body1["children"]={};
  body1["children"]["childName"]=body["childname"];
  body1["children"]["busNumber"]=body["busnumber"];
  if(typeof req.body["onum"]==string){
      num=Number(req.body["onum"]);
  }else{
      num=Number(req.body["onum"][0]);
  }
  school.modifyParent(num,body.schoolname,body1);
});


app.post('/unassign',(req,res)=>{
   var body=_.pick(req.body,['deviceId','schoolName','busNumber']);
   if(school.unassignbus(body.busNumber,body.schoolName,body)){
      res.redirect('/menupage');
   }
});

app.post('/deleteParent',(req,res)=>{
  if (school.removeParent(req.body.mobilenumber,req.body.schoolname)){
    res.redirect('/menupage');
  }
});
//----------------------------
//Map Routes
//---------------------

app.get('/mappage',(req,res)=>{
  res.render('secret.ejs');
});

//-----------
//port listenners
//--------------
app.listen(process.env.PORT ||8080,()=>{
  //console.log("server is up");
});
