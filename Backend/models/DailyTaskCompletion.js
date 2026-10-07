const mongoose = require("mongoose");

const dailyTaskCompletionSchema = new mongoose.Schema(
    {
        // User who completed the daily task
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // The daily task being completed
        dailyTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DailyTask",
            required: true
        },

        // Date on which the task was completed
        // Format: YYYY-MM-DD
        date: {
            type: String,
            required: true
        },

        // Completion status
        completed: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// =========================================================
// PREVENT DUPLICATE RECORDS
// =========================================================
//
// A user can have only one completion record
// for a particular daily task on a particular date.
//

dailyTaskCompletionSchema.index(
    {
        user: 1,
        dailyTask: 1,
        date: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    "DailyTaskCompletion",
    dailyTaskCompletionSchema
);