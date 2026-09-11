const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    donationId: String,
    donorName: String,
    donorEmail: String,

    category: String,
    donationTitle: String,
    organization: String,
    donationDate: Date,

    donationType: String,
    quantity: String,
    quantityUnit: String,

    description: String,

    pickupAddress: String,
    city: String,
    pincode: String,

    contactNumber: String,
    pickupDate: Date,
    pickupTime: String,

    notes: String,

    donationImage: String,

    status: {
        type: String,
        default: "Pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Donation", donationSchema);