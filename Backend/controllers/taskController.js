
const Task = require("../models/Task");

const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const PRIORITY_ORDER = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
};

// Normalize and validate priority
const normalizePriority = (priority) => {
    if (typeof priority !== "string") {
        return null;
    }

    const normalized = priority.trim().toUpperCase();

    return VALID_PRIORITIES.includes(normalized)
        ? normalized
        : null;
};


// ==========================================
// CREATE TASK
// ==========================================
const createTask = async (req, res) => {
    try {
        const { title, date, priority, status } = req.body;

        if (!title || !date || priority === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title, date and priority are required"
            });
        }

        const normalizedPriority = normalizePriority(priority);

        if (!normalizedPriority) {
            return res.status(400).json({
                success: false,
                message: "Priority must be HIGH, MEDIUM, or LOW"
            });
        }

        const task = await Task.create({
            user: req.user,
            title,
            date,
            priority: normalizedPriority,
            ...(status !== undefined && { status })
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL TASKS
// ==========================================
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user
        }).sort({
            date: 1,
            createdAt: 1
        });

        // Sort by priority within each date:
        // HIGH -> MEDIUM -> LOW
        tasks.sort((a, b) => {
            const dateComparison = a.date.localeCompare(b.date);

            if (dateComparison !== 0) {
                return dateComparison;
            }

            const priorityA =
                PRIORITY_ORDER[a.priority] ?? 4;

            const priorityB =
                PRIORITY_ORDER[b.priority] ?? 4;

            return priorityA - priorityB;
        });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET SINGLE TASK
// ==========================================
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).json({
            success: true,
            task
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE TASK
// ==========================================
const updateTask = async (req, res) => {
    try {
        const { title, date, priority, status } = req.body;

        const updates = {};

        // Only update fields included in the request
        if (title !== undefined) updates.title = title;
        if (date !== undefined) updates.date = date;
        if (status !== undefined) updates.status = status;

        if (priority !== undefined) {
            const normalizedPriority =
                normalizePriority(priority);

            if (!normalizedPriority) {
                return res.status(400).json({
                    success: false,
                    message: "Priority must be HIGH, MEDIUM, or LOW"
                });
            }

            updates.priority = normalizedPriority;
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE TASK
// ==========================================
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};