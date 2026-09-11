const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./db");
const User = require("./models/User");
const Donation = require("./models/donation");
const DonationRequest = require("./models/DonationRequest");
const Organization = require("./models/organization");
const donor = require("./models/donor");
const Category = require("./models/Category");
const adminProfile = require("./models/adminProfile");
const multer = require("multer");
const Profile = require("./models/profile");
const app = express();

// connect db
connectDB();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(
  session({
    secret: "donationappsecret",
    resave: false,
    saveUninitialized: true
  })
);

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.locals.loggedInUserName = req.session.user ? req.session.user.name : "admin";
  res.locals.loggedInUserRole = req.session.user
        ? req.session.user.role
        : "";
  next();
});

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Optional: /index also opens same page
app.get("/index", (req, res) => {
  res.render("index");
});

// register page
app.get("/register", (req, res) => {
  res.render("register", {
    error: req.query.error || null
  });
});

// login page
app.get("/login", (req, res) => {
  res.render("login", {
    success: req.query.success || null,
    error: req.query.error || null
  });
});

// register user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect("/register?error=User already exists with this email");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "donor"   // every normal registered user becomes donor
    });

    await newUser.save();
    return res.redirect("/login?success=Registration successful");
  } catch (error) {
    console.log(error);
    return res.redirect("/register?error=Error in registration");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login?error=User not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/login?error=Invalid password");
    }
    user.lastLogin = new Date();
    await user.save();
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    console.log("LOGIN:", user.email, "ROLE:", user.role);
    if (user.role === "admin") {
    return res.redirect("/adminDashboard");
} else if (user.role === "donor") {
    return res.redirect("/donarDashboard");
}
  } catch (error) {
    console.log("Login error:", error);
    return res.redirect("/login?error=Error in login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.send("Error while logging out");
    }
    res.redirect("/login");
  });
});


app.get("/create-admin", async (req, res) => {
  try {
    const existingadmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingadmin) {
      return res.send("admin already exists");
    }
    const hashedPassword = await bcrypt.hash("admin@123", 10);
    const admin = new User({
      name: "admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      lastLogin: new Date(),
      role: "admin"
    });
    await admin.save();
    res.send("admin created successfully");
  } catch (error) {
    console.log(error);
    res.send("Error creating admin");
  }
});

app.get("/adminDashboard", async (req, res) => {
  try {
    // Cards
    const totalDonations = await Donation.countDocuments();
    const totaldonors = await Profile.countDocuments();
    const totalOrganizations = await Organization.countDocuments();
    const pendingDonations = await Donation.countDocuments({ status: "Pending" });
    const completedDonations = await Donation.countDocuments({ status: "Completed" });

    // Recent donations
    const recentDonations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent donation requests
    const recentRequests = await DonationRequest.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("adminDashboard", {
      user: req.session.user,
      totalDonations,
      totaldonors,
      totalOrganizations,
      pendingDonations,
      completedDonations,
      recentDonations,
      recentRequests
    });

  } catch (error) {
    console.log("Error loading admin dashboard:", error);
    res.send("Error loading admin dashboard");
  }
});


function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function isadmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.redirect("/donarDashboard");
  }
  next();
}

function isdonor(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "donor") {
    return res.redirect("/adminDashboard");
  }
  next();
}

app.get("/adminProfile", isadmin, async (req, res) => {
  try {
    const admin = await adminProfile.findOne().sort({ createdAt: 1 });
    const totalDonations = await Donation.countDocuments();
    const totaldonors = await donor.countDocuments();
    const totalOrganizations = await Organization.countDocuments();
    const pendingDonations = await Donation.countDocuments({ status: "Pending" });
    const completedDonations = await Donation.countDocuments({ status: "Completed" });

    res.render("adminProfile", {
      admin,
      totalDonations,
      totaldonors,
      totalOrganizations,
      pendingDonations,
      completedDonations
    });
  } catch (error) {
    console.log("Error loading admin profile:", error);
    res.send("Error loading admin profile");
  }
});

app.get("/adminProfile", isadmin, async (req, res) => {
    const admin = await User.findById(req.session.user._id);
    console.log(admin.lastLogin);
    res.render("adminProfile", {
        admin
    });
});

app.get("/adminEditProfile", isadmin, async (req, res) => {
  try {
    const admin = await adminProfile.findOne().sort({ createdAt: 1 });
    res.render("adminEditProfile", { admin });
  } catch (error) {
    console.log("Error loading edit profile page:", error);
    res.send("Error loading edit profile page");
  }
});

app.get("/donarDashboard", isdonor, async (req, res) => {
  try {
    const donorEmail = req.session.user.email;
    const donations = await Donation.find({ donorEmail }).sort({ createdAt: -1 });
    const totalDonations = await Donation.countDocuments({ donorEmail });
    const pendingDonations = await Donation.countDocuments({ donorEmail, status: "Pending" });
    const acceptedDonations = await Donation.countDocuments({ donorEmail, status: "Accepted" });
    const completedDonations = await Donation.countDocuments({ donorEmail, status: "Completed" });
    const organizationSupportData = await Donation.distinct("organization", { donorEmail });
    const organizationsSupported = organizationSupportData.length;

    res.render("donarDashboard", {
      donations,
      totalDonations,
      pendingDonations,
      acceptedDonations,
      completedDonations,
      organizationsSupported
    });
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

// Show all donations + counts
app.get("/adminDonation", isadmin, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: "Completed" });
    const pendingDonations = await Donation.countDocuments({ status: "Pending" });
    const cancelledDonations = await Donation.countDocuments({ status: "Cancelled" });
    res.render("adminDonation", {
      donations,
      totalDonations,
      completedDonations,
      pendingDonations,
      cancelledDonations
    });
  } catch (error) {
    console.log("Error loading admin donation page:", error);
    res.send("Error loading admin donation page");
  }
});

app.post("/adminDonation", isadmin, async (req, res) => {
  try {
    const {
      donorName,
      donorEmail,
      donationTitle,
      organization,
      category,
      quantity,
      status,
      date
    } = req.body;
    const count = await Donation.countDocuments();
    const donationId = "DON" + String(count + 1).padStart(3, "0");
    const newDonation = new Donation({
      donationId,
      donorName,
      donorEmail,
      donationTitle,
      organization,
      category,
      quantity,
      status,
      date
    });

    await newDonation.save();
    res.redirect("/adminDonation");
  } catch (error) {
    console.log(error);
    res.send("Error adding donation");
  }
});

app.get("/donationreq", isadmin, async (req, res) => {
  try {
    const requests = await DonationRequest.find().sort({ createdAt: -1 });
    const totalRequests = await DonationRequest.countDocuments();
    const pendingRequests = await DonationRequest.countDocuments({ status: "Pending" });
    const approvedRequests = await DonationRequest.countDocuments({ status: "Approved" });
    const rejectedRequests = await DonationRequest.countDocuments({ status: "Rejected" });
    res.render("donationreq", {
      requests,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    });
  } catch (error) {
    console.log("Error loading donation request page:", error);
    res.send("Error loading donation request page");
  }
});

app.post("/donationreq", isadmin, async (req, res) => {
  try {
    const { organization, categoryItem, quantityDetails, status } = req.body;
    const count = await DonationRequest.countDocuments();
    const requestId = "REQ" + String(count + 1).padStart(3, "0");
    const newRequest = new DonationRequest({
      requestId,
      organization,
      categoryItem,
      quantityDetails,
      status
    });
    await newRequest.save();
    res.redirect("/donationreq");
  } catch (error) {
    console.log("Error adding donation request:", error);
    res.send("Error adding donation request");
  }
});

app.get("/adminorg", isadmin, async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    const totalOrganizations = await Organization.countDocuments();
    const activeOrganizations = await Organization.countDocuments({ status: "Active" });
    const inactiveOrganizations = await Organization.countDocuments({ status: "Inactive" });
    const pendingOrganizations = await Organization.countDocuments({ status: "Pending" });
    res.render("adminorg", {
      organizations,
      totalOrganizations,
      activeOrganizations,
      inactiveOrganizations,
      pendingOrganizations
    });
  } catch (error) {
    console.log("Error loading organization page:", error);
    res.send("Error loading organization page");
  }
});

app.post("/adminorg", isadmin, async (req, res) => {
  try {
    const { organizationName, type, location, contact, status } = req.body;
    const count = await Organization.countDocuments();
    const organizationId = "ORG" + String(count + 1).padStart(3, "0");
    const newOrganization = new Organization({
      organizationId,
      organizationName,
      type,
      location,
      contact,
      status
    });
    await newOrganization.save();
    res.redirect("/adminorg");
  } catch (error) {
    console.log("Error adding organization:", error);
    res.send("Error adding organization");
  }
});
app.get("/donor", isadmin, async (req, res) => {
  try {
    const donors = await Profile.find().sort({ createdAt: -1 });
    console.log(donors);   // Add this line    
    const totaldonors = donors.length;
    const activedonors = donors.length;   // all registered donors
    const inactivedonors = 0;
    const blockeddonors = 0;
    res.render("donor", {
      donors,
      totaldonors,
      activedonors,
      inactivedonors,
      blockeddonors
    });
  } catch (error) {
    console.log("Error loading donor page:", error);
    res.send("Error loading donor page");
  }
});

app.post("/donor", isadmin, async (req, res) => {
  try {
    const {
      donorName,
      email,
      phone,
      totalDonations,
      totalDonationAmount,
      status
    } = req.body;

    // check if donor email already exists
    const existingdonor = await donor.findOne({ email });
    if (existingdonor) {
      return res.send("donor with this email already exists");
    }
    const count = await donor.countDocuments();
    const donorId = "DONR" + String(count + 1).padStart(3, "0");
    const newdonor = new donor({
      donorId,
      donorName,
      email,
      phone,
      totalDonations,
      totalDonationAmount,
      status
    });
    await newdonor.save();
    res.redirect("/donor");
  } catch (error) {
    console.log("Error adding donor:", error);
    res.send("Error adding donor");
  }
});

app.get("/donateCat", isadmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ status: "Active" });
    const inactiveCategories = await Category.countDocuments({ status: "Inactive" });
    // sum of all totalDonations from category table
    const totalItemDonatedData = await Category.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$totalDonations" }
        }
      }
    ]);
    const totalItemDonated =
      totalItemDonatedData.length > 0 ? totalItemDonatedData[0].totalItems : 0;
    res.render("donateCat", {
      categories,
      totalCategories,
      activeCategories,
      inactiveCategories,
      totalItemDonated
    });
  } catch (error) {
    console.log("Error loading category page:", error);
    res.send("Error loading category page");
  }
});

app.post("/donateCat", isadmin, async (req, res) => {
  try {
    const { categoryName, description, totalDonations, status } = req.body;
    // check if category already exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.send("Category already exists");
    }
    const count = await Category.countDocuments();
    const categoryId = "CAT" + String(count + 1).padStart(3, "0");
    const newCategory = new Category({
      categoryId,
      categoryName,
      description,
      totalDonations,
      status
    });
    await newCategory.save();
    res.redirect("/donateCat");
  } catch (error) {
    console.log("Error adding category:", error);
    res.send("Error adding category");
  }
});

app.post("/adminEditProfile", isadmin, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      pincode
    } = req.body;
    let admin = await adminProfile.findOne().sort({ createdAt: 1 });
    if (admin) {
      admin.fullName = fullName;
      admin.email = email;
      admin.phone = phone;
      admin.dateOfBirth = dateOfBirth;
      admin.gender = gender;
      admin.address = address;
      admin.city = city;
      admin.state = state;
      admin.country = country;
      admin.pincode = pincode;
      await admin.save();
    } else {
      await adminProfile.create({
        fullName,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        country,
        pincode
      });
    }
    res.redirect("/adminProfile");
  } catch (error) {
    console.log("Error updating profile:", error);
    res.send("Error updating profile");
  }
});

app.get("/makeDonation", isdonor, async (req, res) => {
  try {
    const organizations = await Organization.find();
    const categories = await Category.find();
    res.render("makeDonation", {
      organizations,
      categories
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading Make Donation page");
  }
});

app.post("/makeDonation", isdonor, upload.single("image"), async (req, res) => {
  try {
    const count = await Donation.countDocuments();
    const donationId = "DON" + String(count + 1).padStart(3, "0");
    const donation = new Donation({
      donationId,
      donorName: req.session.user.name,
      donorEmail: req.session.user.email,
      category: req.body.category,
      organization: req.body.organization,
      donationDate: req.body.donationDate,
      donationTitle: req.body.donationTitle,
      donationType: req.body.donationType,
      quantity: req.body.quantity,
      quantityUnit: req.body.quantityUnit,
      description: req.body.description,
      pickupAddress: req.body.pickupAddress,
      city: req.body.city,
      pincode: req.body.pincode,
      contactNumber: req.body.contactNumber,
      pickupDate: req.body.pickupDate,
      pickupTime: req.body.pickupTime,
      notes: req.body.notes,
      donationImage: req.file.filename,
      status: "Pending"
    });
    await donation.save();
    res.redirect("/myDonation");
  }catch (err) {
    console.error(err);
    res.send(err.message);
  }
});

app.get("/myDonation", isdonor, async (req, res) => {
  try {
    const donorEmail = req.session.user.email;
    // Table Data
    const donations = await Donation.find({
      donorEmail: donorEmail
    }).sort({ createdAt: -1 });
    // Card Counts
    const totalDonations = await Donation.countDocuments({
      donorEmail: donorEmail
    });
    const pendingDonations = await Donation.countDocuments({
      donorEmail: donorEmail,
      status: "Pending"
    });
    const acceptedDonations = await Donation.countDocuments({
      donorEmail: donorEmail,
      status: "Accepted"
    });
    const completedDonations = await Donation.countDocuments({
      donorEmail: donorEmail,
      status: "Completed"
    });
    const rejectedDonations = await Donation.countDocuments({
      donorEmail: donorEmail,
      status: "Rejected"
    });
    res.render("myDonation", {
      donations,
      totalDonations,
      pendingDonations,
      acceptedDonations,
      completedDonations,
      rejectedDonations,
      user: req.session.user
    });
  } catch (err) {
    console.log("ERROR:", err);
    res.send(err.message);
  }
});

app.get("/viewDonation/:id", isLoggedIn, async (req, res) => {
    const donation = await Donation.findById(req.params.id);
    res.render("viewDonation", {
        donation
    });
});

app.get("/oragnization", isdonor, async (req, res) => {
    try {
        const organizations = await Organization.find({
            status: "Active"
        }).sort({ createdAt: -1 });
        res.render("oragnization", {
            organizations
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
});
app.post("/oragnization", async (req, res) => {
  try {
    const count = await Organization.countDocuments();
    const organizationId = "ORG" + String(count + 1).padStart(3, "0");
    const organization = new Organization({
      organizationId,
      organizationName: req.body.organizationName,
      type: req.body.type,
      location: req.body.location,
      contact: req.body.contact,
      status: req.body.status
    });
    await organization.save();
    res.redirect("/oragnization");
  }catch (err) {
    console.log(err);
    res.send("Error Saving Organization");
  }
});

app.get("/profile", isdonor, async (req, res) => {
  try {
    const userProfile = await Profile.findOne({
    userId: req.session.user.id
    });
    const totalDonations = await Donation.countDocuments({
    donorEmail: req.session.user.email
    });
    const pendingDonations = await Donation.countDocuments({
    donorEmail: req.session.user.email,
    status: "Pending"
    });
    const completedDonations = await Donation.countDocuments({
    donorEmail: req.session.user.email,
    status: "Completed"
    });
    const organizationsSupported = (
    await Donation.distinct(
        "organization",
        {
          donorEmail: req.session.user.email
        }
      )
    ).length;
    res.render("profile", {
      user: req.session.user,
      profile: userProfile,
      totalDonations,
      pendingDonations,
      completedDonations,
      organizationsSupported
    });
  } catch (err) {
    console.log(err);
    res.send("Error Loading Profile");
  }
});

app.get("/editProfile", isdonor, async (req, res) => {
  try {
    let profile = await Profile.findOne({
      userId: req.session.user.id
    });
    res.render("editProfile", {
      user: req.session.user,
      profile
    });
  } catch (err) {
    console.log(err);
    res.send("Error Loading Edit Profile");
  }
});

app.post("/editProfile", isdonor, upload.single("image"), async (req, res) => {
  try {
    let profile = await Profile.findOne({
      userId: req.session.user.id
    });
    if (!profile) {
      profile = new Profile({
        userId: req.session.user.id
      });
    }
    profile.fullName = req.body.fullName;
    profile.email = req.body.email;
    profile.phone = req.body.phone;
    profile.dateOfBirth = req.body.dateOfBirth;
    profile.gender = req.body.gender;
    profile.role = req.body.role;
    profile.address = req.body.address;
    profile.city = req.body.city;
    profile.state = req.body.state;
    profile.pincode = req.body.pincode;
    if (req.file) {
      profile.image = req.file.filename;
    }
    await profile.save();
    res.redirect("/profile");
  } catch (err) {
    console.log(err);
    res.send("Error Updating Profile");
  }
});

app.post("/editProfile", async (req, res) => {
  try {
    const userId = req.session.user._id;
    await User.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        dob: req.body.dob,
        gender: req.body.gender,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
      },
      {
        new: true
      }
    );
    res.redirect("/profile");
  }
  catch (err) {
    console.log(err);
    res.status(500).send("Update Failed");
  }
});
app.get("/editProfile",async(req,res)=>{
const userId=req.session.user._id;
const user=await User.findById(userId);
res.render("editProfile",
{
user:user
});
});
app.get("/addDonation", isadmin, (req, res) => {
    res.render("addDonation");
});
app.post("/addDonation", upload.single("image"), async (req, res) => {
    console.log("POST route reached");
    try {
        const donation = new Donation({
          donationId: "DON" + Date.now(),
          donorName: req.body.donorName,
          donorEmail: req.body.donorEmail,
          category: req.body.category,
          organization: req.body.organization,
          donationDate: req.body.donationDate,
          donationTitle: req.body.donationTitle,
          donationType: req.body.donationType,
          quantity: req.body.quantity,
          quantityUnit: req.body.quantityUnit,
          description: req.body.description,
          pickupAddress: req.body.pickupAddress,
          city: req.body.city,
          pincode: req.body.pincode,
          contactNumber: req.body.contactNumber,
          pickupDate: req.body.pickupDate,
          pickupTime: req.body.pickupTime,
          notes: req.body.notes,
          donationImage: req.file ? req.file.filename : "",
          status: req.body.status
        });
        await donation.save();
        res.redirect("/adminDonation");
    } catch (err) {
        console.log(err);
    }
});

app.get("/adminDonation", isadmin, async (req, res) => {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.render("adminDonation", {
        donations
    });
});

app.get("/deleteDonation/:id", isadmin, async (req, res) => {
    await Donation.findByIdAndDelete(req.params.id);
    res.redirect("/adminDonation");
});

app.get("/editDonation/:id", isadmin, async (req, res) => {
    const donation = await Donation.findById(req.params.id);
    res.render("editDonation", {
        donation
    });
});

app.post("/editDonation/:id", upload.single("image"), async (req, res) => {
    const data = {
        donorName: req.body.donorName,
        category: req.body.category,
        itemName: req.body.itemName,
        quantity: req.body.quantity,
        description: req.body.description,
        status: req.body.status
    };
    await Donation.findByIdAndUpdate(req.params.id, data);
    res.redirect("/adminDonation");
});

app.get("/addOrg", isadmin, (req, res) => {
    res.render("addOrg", {
        user: req.session.user
    });
});

app.post("/adminorg/add", isadmin, async (req, res) => {
  console.log(req.body); 
  try {
        const count = await Organization.countDocuments();
        const organizationId =
            "ORG" + String(count + 1).padStart(3, "0");
        console.log(req.body);
        const organization = new Organization({
            organizationId,
            organizationName: req.body.organizationName,
            type: req.body.type,
            location: req.body.location,
            contact: req.body.contact,
            status: req.body.status
        });
        await organization.save();
        res.redirect("/adminorg");
    } catch (err) {
        console.log(err);
        res.send("Error adding organization");
    }
});

app.get("/adminorg/delete/:id", isadmin, async (req, res) => {
    try {
        await Organization.findByIdAndDelete(req.params.id);
        res.redirect("/adminorg");
    } catch (err) {
        console.log(err);
        res.send("Error deleting organization");
    }
});

app.get("/adminorg/edit/:id", isadmin, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.send("Organization not found");
        }
        res.render("editOrg", {
            organization
        });
    } catch (err) {
        console.log(err);
        res.send("Error loading organization");
    }
});

app.post("/adminorg/edit/:id", isadmin, async (req, res) => {
    try {
        await Organization.findByIdAndUpdate(req.params.id, {
            organizationName: req.body.organizationName,
            type: req.body.type,
            location: req.body.location,
            contact: req.body.contact,
            status: req.body.status,
        });
        res.redirect("/adminorg");
    } catch (err) {
        console.log(err);
        res.send("Error updating organization");
    }
});

app.get("/editdonor/:id", isadmin, async (req, res) => {
    try {
        const donor = await Profile.findById(req.params.id);
        if (!donor) {
            return res.send("donor not found");
        }
        res.render("editdonor", { donor });
    } catch (err) {
        console.log(err);
        res.send("Error loading donor");
    }
});

app.post("/editdonor/:id", isadmin, async (req, res) => {
    try {
        await Profile.findByIdAndUpdate(req.params.id, {
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode
        });
        res.redirect("/donor");
    } catch (err) {
        console.log(err);
        res.send("Error updating donor");
    }
});

app.get("/deletedonor/:id", isadmin, async (req, res) => {
    try {
        await Profile.findByIdAndDelete(req.params.id);
        res.redirect("/donor");
    } catch (err) {
        console.log(err);
        res.send("Error deleting donor");
    }
});

app.get("/addDonationReq", isadmin, (req, res) => {
    res.render("addDonationReq");
});

app.post("/addDonationReq", isadmin, async (req, res) => {
    const total = await DonationRequest.countDocuments();
    const requestId = "REQ" + String(total + 1).padStart(3, "0");
    await DonationRequest.create({
        requestId,
        organizationName: req.body.organizationName,
        donationCategory: req.body.donationCategory,
        quantity: req.body.quantity,
        requestDate: req.body.requestDate,
        status: req.body.status
    });
    res.redirect("/donationreq");
});

app.get("/editDonationReq/:id", isadmin, async (req, res) => {
    const request = await DonationRequest.findById(req.params.id);
    res.render("editDonationReq", {
        request
    });
});

app.post("/editDonationReq/:id", isadmin, async (req, res) => {
    const total = await DonationRequest.countDocuments();
    const requestId = "REQ" + String(total + 1).padStart(3, "0");
    await DonationRequest.findByIdAndUpdate(req.params.id, {
        requestId,
        organizationName: req.body.organizationName,
        donationCategory: req.body.donationCategory,
        quantity: req.body.quantity,
        requestDate: req.body.requestDate,
        status: req.body.status
    });
    res.redirect("/donationreq");
});

app.get("/deleteDonationRequest/:id", isadmin, async (req, res) => {
    try {
        await DonationRequest.findByIdAndDelete(req.params.id);
        res.redirect("/donationreq");
    } catch (err) {
        console.log(err);
        res.send("Error deleting donation request");
    }
});

app.get("/addDonationCat", isadmin, (req, res) => {
    res.render("addDonationCat");
});

app.post("/addDonationCat", isadmin, async (req, res) => {
    const count = await Category.countDocuments();
    const categoryId = "CAT" + String(count + 1).padStart(3, "0");
    await Category.create({
        categoryId,
        categoryName: req.body.categoryName,
        description: req.body.description,
        status: req.body.status
    });
    res.redirect("/donateCat");
});

app.get("/editDonationCat/:id", isadmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.send("Category not found");
        }
        res.render("editDonationCat", {
            category
        });
    } catch (err) {
        console.log(err);
        res.send("Error loading edit page");
    }
});

app.post("/editDonationCat/:id", isadmin, async (req, res) => {
    await Category.findByIdAndUpdate(req.params.id, {
        categoryName: req.body.categoryName,
        description: req.body.description,
        status: req.body.status
    });
    res.redirect("/donateCat");
});

app.get("/deleteDonationCat/:id", isadmin, async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/donateCat");
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});