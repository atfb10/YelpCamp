// All middleware functions go here

// Require models
var Campground = require("../models/campground");
var Comment = require("../models/comment");

// create object that stores all functions
var middlewareObj = {};

// Check if user is logged
middlewareObj.isLoggedIn = function(req, res, next) {
    // see if user is logged in
    if (req.isAuthenticated()) {
        // execute code after this middleware if true
        return next();
    } else {
        // Return error message
        req.flash("error", "You must be logged in to do that");
        // If user is not logged in, redirect them to the sites login page
        res.redirect("/login");
    }
}

// sees if user owns campground content or is admin
middlewareObj.checkUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        // Find campground by id
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err) {
                req.flash("error", "Campground not found");
                res.redirect()
            } else {
                // See if user owns the campground or is admin
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    // Render page if authenticated and the owner
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that")
                    // If not owner send to previous page
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Please Login");
        // If not authenticated send to previous page
        res.redirect("back");
    }
}

// See if user owns comment
middlewareObj.checkCommentOwner = function(req, res, next) {
    if (req.isAuthenticated()) {
        // Find comment by id
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                console.log(err);
            } else {
                // See if user owns the campground
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    // Render page if authenticated and the owner
                    next();
                } else {
                    // Give error message
                    req.flash("error", "You don't have permission to do that");
                    // If not owner send to previous page
                    res.redirect("back");
                }
            }
        });
    } else {
        // Give error message
        req.flash("error", "You need to be logged in to do that");
        // If not authenticated send to previous page
        res.redirect("back");
    }
}

// Fuzzy search with regular expressions
middlewareObj.fuzzySearch = function(text) {
    // match any characters globally
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// export all methods
module.exports = middlewareObj;