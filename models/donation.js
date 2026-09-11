const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      required: true
    },
    donorName: {
      type: String,
      required: true
    },
    donorEmail: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },
    organization: {
      type: String,
      required: true
    },
    donationDate: {
      type: String,
      required: true
    },

    donationTitle: {
      type: String,
      required: true
    },
    donationType: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    quantityUnit: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },

    pickupAddress: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    pickupDate: {
      type: String,
      required: true
    },
    pickupTime: {
      type: String,
      required: true
    },

    notes: {
      type: String
    },
    donationImage: {
      type: String
    },

    status: {
      type: String,
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
