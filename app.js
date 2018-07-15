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
var {authenticate}=require('./server/middlewares/authenticate.js');
let {school,child,parent}= require('./server/models/schools.js');
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
//middleware for school login

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
};
//---------------------------------------------------------
//middleware that returns the total schools array--
//----------------
function getSchools(req,res,next){
  school.find({service:'GST'},(err,schools)=>{
    req.schools=schools;
    next();
  });
};
//------------------------
//---middleware for school dashboard
//---------------
function checkschool(req,res,next){

  school.findByCredentials(req.body.username,req.body.password).then((user)=>{
    req.school=user;
    return user.genAuthToken();
  }).then((token)=>{
      res.cookie('x-auth',token);
      next();
  }).catch((e)=>{
    res.status(400).send();
    res.redirect('/loginpage');
  });
}
function headerfetch(req,res,next){
  var x=req.headers.cookie;
  x=x+';';
 console.log(x);
  var cookieStart=req.headers.cookie.indexOf('x-auth'+"=");
 console.log(cookieStart);
var cookieEnd=x.indexOf(';',cookieStart);
console.log(cookieEnd);
if (cookieEnd==-1){
  var c=_.split(x,'=');
  console.log(c);
  req.authheader=c[1];
  next();

}else{
  var thisCookie=req.headers.cookie.substring(cookieStart,cookieEnd);
  // console.log(thisCookie);
  var c=_.split(thisCookie,'=');
  console.log(c);
  req.authheader=c[1];
  next();


}
}
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
app.post('/schoollogin',checkschool,(req,res)=>{
  console.log(req.school);
  res.send("succesfully logged into school");
});

app.post('/schoollogout',headerfetch,authenticate,(req,res)=>{
  req.user.removeToken(req.token).then(()=>{
    res.clearCookie('x-auth',req.token);
    res.status(200).redirect('/loginpage');
  },()=>{
    res.status(400).send();
  });
})
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
var count=1;
  var body=_.pick(req.body,['mobilenumber','childname','parentname','schoolname','busnumber','address','email','type']);
  var newparent=new parent({mobileNumber:body.mobilenumber,parentName:body.parentname,address:body.address,emailAddress:body.email,children:[]});
  if (_.isArray(body.childname))
  {for (i=0;i<body.childname.length;i++){
    var childpush=new child({busNumber:body.busnumber[i],childName:body.childname[i]});
    newparent.children.push(childpush);

  }
  count=body.childname.length;
}
  else{
    var childpush=new child({busNumber:body.busnumber,childName:body.childname});
    newparent.children.push(childpush);
  }
  school.findOne({name:body.schoolname},(err,doc)=>{

    doc.parents.push(newparent);
    doc.childrenNumber+=count;
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

  var body=_.pick(req.body,['mobilenumber','parentname','address','email','childname','busnumber','schoolname','oldnumber','oldnum']);
console.log(body.oldnumber);
  // body.oldnumber=body.oldnumber[0];
  // parseInt(body.oldnumber,10);
  var newparent=new parent({mobileNumber:body.mobilenumber,parentName:body.parentname,address:body.address,emailAddress:body.email,children:[]});
 console.log(body.oldnum);
var finalnumber;
  school.findOneAndUpdate({name:body.schoolname},{$pull:{parents:{mobileNumber:body.oldnumber}}}).then((doc)=>{

    if (_.isArray(body.childname))
    {for (i=0;i<body.childname.length;i++){
      var childpush=new child({busNumber:body.busnumber[i],childName:body.childname[i]});
      newparent.children.push(childpush);
      console.log(newparent);
      finalnumber=doc.childrenNumber-body.oldnum+body.childname.length;

    }
     return {parent:newparent,number:finalnumber};
  }
    else{
      var childpush=new child({busNumber:body.busnumber,childName:body.childname});
      newparent.children.push(childpush);
    finalnumber=doc.childrenNumber-body.oldnum+1;
     return {parent:newparent,number:finalnumber};
    }


 }).then((data)=>{
   console.log(data);
      school.findOneAndUpdate({service:'GST'},{$set:{childrenNumber:data.number},$push:{parents:data.parent}},(err,doc)=>{
  console.log(doc);
  res.send('check console');
  });
}).catch((e)=>{
  res.status(400).send('something went wrong ...check server');
})
});
//------------------------------
//routes for children add as per the parent name and schoolname only
//----------------------------------
app.post('/addchildren',(req,res)=>{
  school.find({name:req.body.schoolname}).then((doc)=>{
    var reqParent=_.find(doc.parents,function(parent){return parent.parentName==req.body.parentname})
    var newparent=new parent({mobileNumber:reqParent.mobileNumber,parentName:reqParent.parentName,address:reqParent.address,emailAddress:reqParent.emailAddress,children:[]});
    if (_.isArray(req.body.childname))
    {for (i=0;i<req.body.childname.length;i++){
      var childpush=new child({busNumber:body.busnumber[i],childName:body.childname[i]});
      newparent.children.push(childpush);
      var finalnumber=doc.childrenNumber-body.oldnum+body.childname.length;

    }
   return {parent:newparent,number:finalnumber};
  }
    else{
      var childpush=new child({busNumber:body.busnumber,childName:body.childname});
      newparent.children.push(childpush);
    var finalnumber=doc.childrenNumber-body.oldnum+1;

    }
     return {parent:newparent,number:finalnumber};
  }).then((data)=>{
    school.findOneAndUpdate({name:req.body.schoolname},{$set:{childrenNumber:data.number},$push:{parents:data.parent}},(err,doc)=>{
  res.redirect("/menupage");
});
}).catch((e)=>{
  res.status(400).send('something went wrong..consult server');
})
});

app.post('/modifychildren',(req,res)=>{
  school.findOneAndUpdate({name:req.body.oldschoolname},{$pull:{parents:{parentName:req.body.oldparentname}}}).then((doc)=>{
    var reqParent=_.find(doc.parents,function(parent){return parent.parentName==req.body.parentname})
    var newparent=new parent({mobileNumber:reqParent.mobileNumber,parentName:reqParent.parentName,address:reqParent.address,emailAddress:reqParent.emailAddress,children:[]});
    if (_.isArray(req.body.childname))
    {for (i=0;i<req.body.childname.length;i++){
      var childpush=new child({busNumber:body.busnumber[i],childName:body.childname[i]});
      newparent.children.push(childpush);
      finalnumber=doc.childrenNumber-body.oldnum+body.childname.length;

    }
   return {parent:newparent,number:finalnumber};}
    else{
      var childpush=new child({busNumber:body.busnumber,childName:body.childname});
      newparent.children.push(childpush);
    finalnumber=doc.childrenNumber-body.oldnum+1;
     return {parent:newparent,number:finalnumber};
    }
  }).then((data)=>{
    school.findOneAndUpdate({name:req.body.schoolname},{$set:{childrenNumber:data.number},$push:{parents:data.parent}},(err,doc)=>{
  res.redirect("/menupage");
});
}).catch((e)=>{
  res.status(400).send("hey something went wrong");
})
});

app.post('/deletechildren',(req,res)=>{
  school.findOneAndUpdate({name:req.body.schoolname},{parents:{$pull:{children:{childName:req.body.childname}}},$inc:{childrenNumber:-1}},(err,doc)=>{
    if (doc){
      res.send('deleted child');}
  });
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

app.get('/school',getSchools,countDetails,devicestates,(req,res)=>{
  res.render('schooldashboard.ejs',{schools:req.schools,children:req.count.children,buses:req.count.buses,parents:req.count.parents,schoolno:req.count.schoolno,result:req.result});
});
//-----------
//port listenners
//--------------
app.listen(process.env.PORT ||8080,()=>{
  //console.log("server is up");
});
