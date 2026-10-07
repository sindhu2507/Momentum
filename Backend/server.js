const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const dailyTaskRoutes = require("./routes/dailyTaskRoutes");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Momentum Backend is running 🚀");
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Normal task routes
app.use("/api/tasks", taskRoutes);

// Daily task routes
app.use("/api/daily-tasks", dailyTaskRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});