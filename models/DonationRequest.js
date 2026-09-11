const mongoose = require("mongoose");

const donationRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    organizationName: {
      type: String,
      required: true
    },
    donationCategory: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationRequest", donationRequestSchema);