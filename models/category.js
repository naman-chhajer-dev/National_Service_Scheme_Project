const mongoose = require("mongoose");

const donationCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true
    },
    categoryName: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", donationCategorySchema);