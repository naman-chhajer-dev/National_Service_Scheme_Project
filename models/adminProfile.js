const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema(
  {
    profilePhoto: {
      type: String,
      default: ""
    },
    fullName: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    dateOfBirth: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: ""
    },
    pincode: {
      type: String,
      default: ""
    },
    adminID: {
      type: String
    },

    role: {
      type: String,
      default: "Admin"
    },

    status: {
      type: String,
      default: "Active"
    },

    lastLogin: {
      type: Date
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminProfile", adminProfileSchema);