var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"); // local mongoose authentication 

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    // Email is required and must be unique to each user
    email: {
        type: String,
        unique: true,
        required: true
    },
    // Resets allow for password to reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean, 
        default: false}
});

// local mongoose authentication plugin
userSchema.plugin(passportLocalMongoose);

// Make model exportable
module.exports = mongoose.model("User", userSchema);