// basic 
var express = require("express");
var router = express.Router();

// Model
var Campground = require("../models/campground");

// Middleware (Note: Will automatically require index.js, if not specified what is required)
var middleware = require("../middleware/index.js");

// Node geocoder
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

// Index Route
router.get("/", function (req, res) {
    // If search return searched for
    if (req.query.search) {
        // Create new variable that holds value of new regular expression from function we 
        var fuzzy = new RegExp(middleware.fuzzySearch(req.query.search), 'gi');
        // Get all campgrounds from db with fuzzy based on campground name
        Campground.find({name: fuzzy}, function (err, allCampgrounds) {
            // Handle errors
            if (err) {
                console.log(err);
            }
            // render all campgrounds found in the db if no error
            else {
                // Handle if no campgrounds are found
                if (allCampgrounds.length === 0) {
                    // Error message that says no matches found
                    req.flash("error", "No Matches Found");
                    return res.redirect("/campgrounds");
                }
                res.render("campgrounds/index.ejs", { campgrounds: allCampgrounds});
            }
        });
    } 
    // if no search return all campgrounds
    else {
        // Get all campgrounds from db
        Campground.find({}, function (err, allCampgrounds) {
            // Handle errors
            if (err) {
                console.log(err);
            }
            // render all campgrounds found in the db if no error
            else {
                res.render("campgrounds/index.ejs", { campgrounds: allCampgrounds });
            }
        });
    }
});

// Create new campground. Note: Must be logged in
router.post("/", middleware.isLoggedIn, function (req, res) {
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {
            name: name,
            image: image,
            description: desc,
            author: author,
            location: location,
            lat: lat,
            lng: lng
        };
        // Create a new campground and save to DB
        Campground.create(newCampground, function (err, newlyCreated) {
            if (err) {
                console.log(err);
            } else {
                //redirect back to campgrounds page
                res.redirect("/campgrounds");
            }
        });
    });
});

// show form to create new campground. Note: Must be logged in
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new.ejs");
});

// Show route
router.get("/:id", function (req, res) {
    // find campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            // render show template with that campground
            res.render("campgrounds/show.ejs", { campground: foundCampground });
        }
    });
    req.params.id;
});

// Edit route. User must be authenticated and logged in
router.get("/:id/edit", middleware.checkUser, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            req.flash("error", "Campground not found");
        } else {
            // if the user is authenticated and logged in. Send to edit page. Checked by "checkUser" middleware
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

// Add update route. User must be authenticated and logged in
router.put("/:id", middleware.checkUser, function (req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, campground) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
    });
});
// Destroy route. User must be authenticated and logged in
router.delete("/:id", middleware.checkUser, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");            
        } else {
            res.redirect("/campgrounds");
        }
    });

});

module.exports = router;