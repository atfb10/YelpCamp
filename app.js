// For heroku deployment later
// heroku config: set GEOCODE_API_KEY = AIzaSyCqr3beuItooosOYesdYVXJ4BoD4qbmu8o

// Packages 
require('dotenv').config(); // dotenv package

var express = require("express"), // express
    app = express(), // express 
    ejs = require("ejs"), // ejs package
    bodyParser = require("body-parser"), // body-parser package
    flash = require("connect-flash"), // package for flash messages
    methodOverride = require("method-override"); // method override for put and get requests
    app.locals.moment = require("moment"); // time since task done. Makes available in all files
    mongoose = require("mongoose"), // mongoose package
    passport = require("passport"), // passport package
    localStrategy = require("passport-local"); // passport-local package
    
// models
var User = require("./models/user"), // user model
    Campground = require("./models/campground"), // campground schema
    Comment = require("./models/comment"), // comment schema
    seedDb = require("./seeds"); // seeds file

// Routes
var campgroundRoutes = require("./routes/campgrounds"),
    commentRoutes = require("./routes/comments"),
    indexRoutes = require("./routes/index");

// standard configs
mongoose.connect("mongodb://localhost/yelp_camp"); // where mongo is connected
app.use(bodyParser.urlencoded({ extended: true })); // body parser
app.set("view engine", "ejs"); // view engine is embedded js
app.use(express.static(__dirname + "/public")); // find and connect custom stylings
app.use(methodOverride("_method")); // look for _method when overriding method
app.use(flash()); // execute flash variable


// Seed the db. Note: Just done for testing purposes
// seedDb(); 

// ===============
// Passport Config
// ===============
app.use(require("express-session")({
    secret: "This is my first real website",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware function to pass user information to each route
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// Routes used here. Note: Must be done after the middleware function and dependent packages
app.use("/campgrounds", campgroundRoutes); // "/campgrounds", appends this to everything in campgrounds.js so it doesn't need to be typed
app.use("/campgrounds/:id/comments", commentRoutes); // "/campgrounds/:id/comments", appends this to everything in comments.js so it doesn't need to be typed
app.use(indexRoutes); // Important: Put index root last because it has * which overrides all over routes


// Setup Port 3000 to be server port
app.listen(3000, process.env.IP, function() {
    console.log("The YelpCamp Server Has Started!");
});




