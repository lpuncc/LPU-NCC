require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://lpunccstaticweb123.z29.web.core.windows.net/registration-system/register.html',
    methods: ["GET", "POST", "DELETE"],
    credentials: false
  }));
  

// 📌 Connect to MongoDB
mongoose.connect(process.env.MONGO_SERVER_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 📌 Define MongoDB Schema & Models
const RegistrationSchema = new mongoose.Schema({
    firstName: String,
    middleName: String,
    lastName: String,
    gender: String,
    regNumber: String,
    mobile: String,
    email: String
});
const Registration = mongoose.model("Registration", RegistrationSchema);

const EnrollmentSchema = new mongoose.Schema({
    enabled: Boolean
});
const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);

// 📌 Get enrollment status
app.get("/api/enrollment", async (req, res) => {
    try {
        let enrollment = await Enrollment.findOne();
        if (!enrollment) {
            enrollment = new Enrollment({ enabled: true });
            await enrollment.save();
        }
        res.json({ enabled: enrollment.enabled });
    } catch (error) {
        console.error("Error fetching enrollment status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Toggle enrollment status
app.post("/api/enrollment", async (req, res) => {
    try {
        let enrollment = await Enrollment.findOne();
        if (!enrollment) {
            enrollment = new Enrollment({ enabled: req.body.enabled });
        } else {
            enrollment.enabled = req.body.enabled;
        }
        await enrollment.save();
        res.json({ message: "Enrollment status updated", enabled: enrollment.enabled });
    } catch (error) {
        console.error("Error updating enrollment status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Get all registrations
app.get("/api/registrations", async (req, res) => {
    try {
        const registrations = await Registration.find();
        res.json(registrations);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Add a new registration
app.post("/api/register", async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne();
        if (!enrollment || !enrollment.enabled) {
            return res.status(403).json({ message: "Enrollment is currently closed." });
        }

        const newRegistration = new Registration(req.body);
        await newRegistration.save();
        res.json({ message: "Registration successful" });
    } catch (error) {
    if (error.code === 11000 && error.keyPattern?.regNumber) {
      return res.status(400).json({ message: "Registration number already exists." });
    }
    console.error("Error saving registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// 📌 Delete a registration with proper error handling
app.delete("/api/registrations/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid registration ID" });
        }

        const deletedRegistration = await Registration.findByIdAndDelete(id);

        if (!deletedRegistration) {
            return res.status(404).json({ message: "Registration not found" });
        }

        res.json({ message: "Registration deleted successfully" });
    } catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
