const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({

    organizationId: String,
    organizationName: String,
    type: String,
    location: String,
    contact: String,

    description: String,

    needs: String,

    image: String,

    joinedOn: String,
    status: {
        type: String,
        default: "Active"
    }

}, { timestamps:true });

module.exports = mongoose.model("Organization", organizationSchema);