const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    fullName: String,
    email: String,
    phone: String,
    gender: String,
    dateOfBirth: String,

    address: String,
    city: String,
    state: String,
    pincode: String,

    profileImage: String

}, {
    timestamps: true
});

module.exports = mongoose.model("Profile", profileSchema);