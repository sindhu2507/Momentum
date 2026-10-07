const mongoose = require("mongoose");

const monthlyVersionSchema = new mongoose.Schema(
    {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },

        year: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        startTime: {
            type: String,
            default: ""
        },

        endTime: {
            type: String,
            default: ""
        },

        // Whether this task is deleted for this
        // particular month only
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        _id: false
    }
);


const dailyTaskSchema = new mongoose.Schema(
    {
        // User who owns this daily task
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Original/default task information
        title: {
            type: String,
            required: true,
            trim: true
        },

        startTime: {
            type: String,
            default: ""
        },

        endTime: {
            type: String,
            default: ""
        },

        // Month-specific task versions
        monthlyVersions: {
            type: [monthlyVersionSchema],
            default: []
        },

        // Whether this task is globally active
        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "DailyTask",
    dailyTaskSchema
);