const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    donorId: {
      type: String,
      required: true,
      unique: true
    },
    donorName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    totalDonationAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active"
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);