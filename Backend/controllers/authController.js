const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// REGISTER USER
// ===============================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};


// ===============================
// LOGIN USER
// ===============================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};


// ===============================
// GET LOGGED-IN USER
// ===============================
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                description: user.description
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get profile",
            error: error.message
        });
    }
};


// ===============================
// UPDATE PROFILE
// ===============================
const updateProfile = async (req, res) => {
    try {
        const { name, email,description } = req.body;
        
        // Check required fields
        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        // Check whether email is already used by another user
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            _id: { $ne: req.user }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email is already in use"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update details
        user.name = name.trim();
        user.email = email.toLowerCase().trim();
        user.description = description?.trim() || "";

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                description: user.description
            }
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        res.status(500).json({
            message: "Profile update failed",
            error: error.message
        });
    }
};


// ===============================
// CHANGE PASSWORD
// ===============================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Check required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        // Check password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Password change failed",
            error: error.message
        });
    }
};


// ===============================
// EXPORT
// ===============================
module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    changePassword
};