const express = require("express");

const {
    createDailyTask,
    getDailyTasks,
    getDailyTaskById,
    updateDailyTask,
    deleteDailyTask,
    getDailyTasksWithCompletions,
    toggleDailyTaskCompletion
} = require("../controllers/dailyTaskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =========================================================
// AUTHENTICATION
// =========================================================

// All daily task routes require a logged-in user
router.use(authMiddleware);


// =========================================================
// DAILY TASK ROUTES
// =========================================================

// Create a daily task
router.post("/", createDailyTask);


// Get all daily tasks
router.get("/", getDailyTasks);


// Get all daily tasks with completion records
router.get(
    "/with-completions",
    getDailyTasksWithCompletions
);


// Get a single daily task
router.get("/:id", getDailyTaskById);


// Update a daily task
router.put("/:id", updateDailyTask);


// Delete a daily task
router.delete("/:id", deleteDailyTask);


// Toggle completion for a particular date
// Example:
// PUT /api/daily-tasks/taskId/completion/2026-09-03
router.put(
    "/:id/completion/:date",
    toggleDailyTaskCompletion
);


module.exports = router;