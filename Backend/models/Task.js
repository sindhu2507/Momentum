const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        // User who owns the task
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Task name
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Task date
        date: {
            type: String,
            required: true
        },

        // Priority type: HIGH, MEDIUM, or LOW
        priority: {
            type: String,
            enum: ["HIGH", "MEDIUM", "LOW"],
            default: "MEDIUM",
            required: true
        },

        // Task status
        status: {
            type: String,
            enum: ["TODO", "IN_PROGRESS", "COMPLETED"],
            default: "TODO"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Task", taskSchema);