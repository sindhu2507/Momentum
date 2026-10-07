const express = require("express");

const {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    changePassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get logged-in user
router.get("/me", authMiddleware, getMe);

// Update profile
router.put("/update-profile", authMiddleware, updateProfile);

// Change password
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;