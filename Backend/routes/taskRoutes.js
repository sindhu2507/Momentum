const express = require("express");

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

// Create a task
router.post("/", createTask);

// Get all tasks
router.get("/", getTasks);

// Get a single task
router.get("/:id", getTaskById);

// Update a task
router.put("/:id", updateTask);

// Delete a task
router.delete("/:id", deleteTask);

module.exports = router;