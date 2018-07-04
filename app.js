const express=                require('express'),
      passport=               require('passport'),
      bodyParser=             require('body-parser'),
      passportLocalMongoose=  require('passport-local-mongoose'),
      localStrategy=          require('passport-local'),
      mongoose=               require('./server/db/mongoose.js'),
      user=                   require('./server/models/user.js');
      const _=require('lodash');
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
      res.redirect('/secret');
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
  var body=_.pick(req.body,['mobile','childname','parentname','name','busnumber']);
  console.log(body);
  school.findOne({name:body.name},(err,doc)=>{
    doc.parents.push({mobileNumber:body.mobile,parentName:body.parentname,childName:body.childname,busNumber:body.busnumber});
    school.findOneAndUpdate({name:body.name},doc,()=>{
      console.log("successfully updated");
        res.redirect('/menupage');
    });
  });
});
app.post('/addBus',(req,res)=>{
  school.findOne({name:req.body.schoolname},(err,doc)=>{
    doc.buses.push({busNumber:req.body.busnumber});
    school.findOneAndUpdate({name:req.body.schoolname},doc,()=>{
      console.log("successfully updated");
        res.send(doc);
    });
  });
});

app.listen(3000,()=>{
  console.log("server is up");
});
