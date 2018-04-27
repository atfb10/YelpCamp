// Basic
var express = require("express");
var router = express.Router();

// Authentication Package
var passport = require("passport");

// Email packages (For password reset)
var nodemailer = require("nodemailer"),
    async = require("async"),
    crypto = require("crypto");

// User Model
var User = require("../models/user"),
    Campground = require("../models/campground");


// Routes

// Root Route 
router.get("/", function (req, res) {
    res.render("landing");
});

// Show register form
router.get("/register", function (req, res) {
    res.render("register");
});

//handle sign up logic
router.post("/register", function (req, res) {
    // new User is taken from form and saved to db
    var newUser = new User({
        username: req.body.username,
        avatar: req.body.avatar,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });

    // if user admin is = to string, give them administrative rights. 
    // String is in .env file hidden for github purposes
    if (req.body.adminCode === process.env.ADMINCODE) {
        newUser.isAdmin = true;
    }
    // Default is set to false regarding administrator
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            // Inform user of error in signing up
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Registration Successful");
            res.redirect("/campgrounds");
        });
    });
});

// Show login form
router.get("/login", function (req, res) {
    // Send to login page and handle errors 
    res.render("login");
});

// Handle login logic
router.post("/login", passport.authenticate("local", {
    // redirect routes upon success or failure to login
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function (req, res) { });

// Handle logout logic
router.get("/logout", function (req, res) {
    // end user session
    req.logout();
    // Show message
    req.flash("success", "You have been logged out");
    // send user to landing page
    res.redirect("/campgrounds");
});

// User forgets password. Render forgot page
router.get("/forgot", function(req, res){
    res.render("forgot");
});

// Route post is sent to 
router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done) {
            // Create crypto of hex that is 20 characters long
            crypto.randomBytes(20, function(err, buf) {
                // create hexadecimal string for token
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            // Find one user by their email
            User.findOne({email: req.body.email}, function(err, user){
                if (!user) {
                    // Inform user if they enter invalid email and send back to forgot page
                    req.flash("error", "No account with that email exists.");
                    res.redirect("back");
                }

                // sets token equal to reset token
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // token invalid after one hr

                // save new user password
                user.save(function(err){
                    done(err, token, user);
                }); 
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'soccercreig3@gmail.com',
                    // GMAILPW can be created by export GMAILPW = yourpasswordhere in terminal
                    // That process will have to be implemented each time this environment is opened
                    // Pass could just be set to email account password but that is security risk on github
                    // Better  option is to download dotenv package and set GMAILPW=your-password in .env file
                    // Then do .gitignore file and put .env in there so that no one on github can see this data
                    // Lower security turned on for this account
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                // Send to user's email address from my email with the following message
                to: user.email,
                from: 'soccercreig3@gmail.com',
                subject: "YelpCamp User Password Reset",
                text: "You are receiving this email because you or someone else requested to reset you Yelpcamp user Password. \n\n" +
                "Please Click on the following link, or paste this in your browser to reset your passoword: \n\n" +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                "If you did not request a reset, please ignore this email and your password will remain unchanged. \n"
            };
            // actually send mail using object mailOptions created above
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "An email has been sent to " + user.email + "with reset instructions");
                done(err, 'done');
            });
        }
        // If there is no error, take back to reset page and message flashed
    ], function(err) {
        if (err) return next(err) 
            res.redirect("back");
    });
});

// send to reset route
router.get("/reset/:token", function(req, res){
    // find one user by token and verify it has not been over hr
    User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: {
            // Greater than current time
            $gt: Date.now()
        }
    }, function(err, user){
        // Handle Errors
        if (!user) {
            req.flash("error", "Password reset token is invalid or expired");
            res.redirect("back");
        } else {
            // Render Password Reset template
            res.render("reset", {token: req.params.token});
        }
    });
});

// Post new password
router.post("/reset/:token", function(req, res) {
    async.waterfall([
        function(done) {
            // Find user by token and time
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function(err, user) {
                if (err) {
                    // Handle error finding user
                    req.flash("error", "Password reset token is invalid or has expired");
                    res.redirect("back");
                } 
                // If passwords don't match, show error
                if(req.body.password !== req.body.confirm) {
                    req.flash("error", "Passwords do not match");
                    res.redirect("back");

                    // If passwords match, update
                } else {
                    // set the new password
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        // Save new user password
                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    });
                }
            });
        },
        // Send mail from Gmail from my account
        function(user, done){
            var smtpTransport = nodemailer.createTransport ({
                service: "Gmail",
                auth: {
                    user: "soccercreig3@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            // data object that holds mail information
            var mailOptions = ({
                to: user.email,
                from: "soccercreig3@gmail.com",
                subject: "YelpCamp Password Changed",
                text: "Hello, \n\n" +
                "This is a confirmation that the password for your account " + user.email + "has been successfully changed.\n"
            });
            // Send mailOptions object and inform user of successful changes
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash("success", "Your Password has been changed");
                done(err);
            });
        }
        // if all goes well, redirect user to campgrounds page
    ], function(err) {
        res.redirect("/campgrounds");
    })
});

// User profiles
router.get("/users/:id", function(req, res){
    // Find user by id
    User.findById(req.params.id, function(err, foundUserProfile) {
        if (err) {
            // Send user back to home page
            req.flash("error", "Could not find user");
            res.redirect("back");
        } 
        // Find authors of campgrounds
        Campground.find().where("author.id").equals(foundUserProfile._id).exec(function(err, campgrounds) {
            if (err) {
                req.flash("error", "User has not posted any campgrounds");
            }
            // render user profile show page
            res.render("users/show", { foundUser: foundUserProfile, campgrounds: campgrounds });
        });
    });
});

// Handle invalid routes
router.get("*", function (req, res) {
    res.send("This route does not exist");
});

// export router
module.exports = router;
