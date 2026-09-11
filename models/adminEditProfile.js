app.post("/editProfile", async (req, res) => {
  try {
    const { fullName, email, phone, location } = req.body;

    let admin = await AdminProfile.findOne();

    if (admin) {
      admin.fullName = fullName;
      admin.email = email;
      admin.phone = phone;
      admin.Gender = Gender;
      admin.dob = dob;
      admin.Address = Address;
      admin.City = City;
      admin.State = State;
      admin.Country = Country;
      admin.Pincode = Pincode;

      await admin.save();
    } else {
      admin = new AdminProfile({
        fullName,
        email,
        phone,
        Gender,
        dob,
        Address,
        City,
        State,
        Country,
        Pincode
      });

      await admin.save();
    }

    res.redirect("/adminProfile");
  } catch (error) {
    console.log(error);
    res.send("Error updating profile");
  }
});