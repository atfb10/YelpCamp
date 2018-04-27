// basic 
var express = require("express");
var router = express.Router({mergeParams: true}); // allows parameters from predefined routes to be included

// models
var Campground = require("../models/campground"),
    Comment = require("../models/comment");

// Middleware
var middleware = require("../middleware/index.js");

// Route to create comments. Note: User must be logged in
router.get("/new", middleware.isLoggedIn, function (req, res) {
    // Find campground by id, so that it can be used in ejs template
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new.ejs", { campground: campground });
        }
    });

});

// Route to post created comment to. Note: User must be logged in 
router.post("/", middleware.isLoggedIn, function (req, res) {
    // lookup campground using id
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            // create new comment
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    req.flash("error", "Uh oh, looks like something went wrong!");
                    console.log(err);
                } else {
                    // Add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    // connect new comment to campground
                    campground.comments.push(comment);
                    campground.save();
                    // Show success message
                    req.flash("success", "Comment Successfully Added!");
                    // redirect to campground show page
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

// Edit route 
router.get("/:comment_id/edit", middleware.checkCommentOwner, function(req, res) {
    // find comment by id
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if (err) {
            res.redirect("back");
        } else {
        //render edit template with campgroundId as req.params.id
        res.render("comments/edit", { 
            campgroundId: req.params.id, 
            comment: foundComment
        });
        }
    });
});

// Update route
router.put("/:comment_id", middleware.checkCommentOwner, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
    
});

// Destroy Route
router.delete("/:comment_id", middleware.checkCommentOwner, function(req, res) {
    // find by id and remove
    Comment.findByIdAndRemove(req.params.comment_id, function(err, deleteComent){
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            // inform user of succesful deletion and then redirect
            req.flash("success", "Campground successfully deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
 
});

module.exports = router;