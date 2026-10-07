const DailyTask = require("../models/DailyTask");
const DailyTaskCompletion = require("../models/DailyTaskCompletion");


// ==========================================================
// GET SELECTED MONTH / YEAR
// ==========================================================

const getMonthYear = (req) => {

    const now = new Date();

    const month = Number(
        req.query.month
    ) || (now.getMonth() + 1);

    const year = Number(
        req.query.year
    ) || now.getFullYear();

    return {
        month,
        year
    };
};


// ==========================================================
// FIND TASK VERSION FOR EXACT MONTH
// ==========================================================
//
// IMPORTANT:
// A task is returned ONLY if it has a version for the
// selected month/year.
//
// There is NO carry-forward between months anymore.
//


const getTaskVersionForMonth = (
    task,
    month,
    year
) => {

    const version =
        (task.monthlyVersions || [])
            .find(
                (item) =>
                    Number(item.month) ===
                        Number(month) &&
                    Number(item.year) ===
                        Number(year)
            );


    // No task for this month
    if (!version) {

        return null;
    }


    // Task was deleted specifically
    // for this month

    if (version.deleted) {

        return {
            deleted: true
        };
    }


    return {

        title:
            version.title,

        startTime:
            version.startTime || "",

        endTime:
            version.endTime || "",

        deleted: false
    };
};


// ==========================================================
// CREATE DAILY TASK
// ==========================================================

const createDailyTask = async (
    req,
    res
) => {

    try {

        const {
            title,
            startTime = "",
            endTime = ""
        } = req.body;


        const {
            month,
            year
        } = getMonthYear(req);


        if (!title || !title.trim()) {

            return res.status(400).json({
                message:
                    "Task title is required"
            });
        }


        // ==================================================
        // CHECK DUPLICATE TASK IN SAME MONTH
        // ==================================================

        const existingTasks =
            await DailyTask.find({
                user: req.user
            });


        const duplicate =
            existingTasks.some(
                (task) => {

                    const version =
                        getTaskVersionForMonth(
                            task,
                            month,
                            year
                        );


                    if (!version) {
                        return false;
                    }


                    if (version.deleted) {
                        return false;
                    }


                    return (
                        version.title
                            .trim()
                            .toLowerCase() ===
                        title
                            .trim()
                            .toLowerCase()
                    );
                }
            );


        if (duplicate) {

            return res.status(400).json({
                message:
                    "This task already exists for this month"
            });
        }


        // ==================================================
        // CREATE TASK
        // ==================================================

        const dailyTask =
            await DailyTask.create({

                user:
                    req.user,

                // Keep base fields for compatibility
                title:
                    title.trim(),

                startTime,

                endTime,

                active:
                    true,

                monthlyVersions: [

                    {
                        year,

                        month,

                        title:
                            title.trim(),

                        startTime,

                        endTime,

                        deleted:
                            false
                    }

                ]
            });


        return res.status(201).json({

            success:
                true,

            dailyTask
        });


    } catch (error) {

        console.error(
            "Create Daily Task Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create daily task",

            error:
                error.message
        });
    }
};


// ==========================================================
// GET DAILY TASKS
// ==========================================================
//
// ONLY tasks belonging to the exact selected month
// are returned.
//


const getDailyTasks = async (
    req,
    res
) => {

    try {

        const {
            month,
            year
        } = getMonthYear(req);


        const tasks =
            await DailyTask.find({
                user: req.user
            }).sort({
                createdAt: 1
            });


        const monthlyTasks = [];


        tasks.forEach(
            (task) => {

                const version =
                    getTaskVersionForMonth(
                        task,
                        month,
                        year
                    );


                // No task for selected month

                if (!version) {
                    return;
                }


                // Deleted for selected month

                if (version.deleted) {
                    return;
                }


                monthlyTasks.push({

                    _id:
                        task._id,

                    user:
                        task.user,

                    title:
                        version.title,

                    startTime:
                        version.startTime,

                    endTime:
                        version.endTime,

                    active:
                        true,

                    createdAt:
                        task.createdAt,

                    updatedAt:
                        task.updatedAt
                });
            }
        );


        return res.status(200).json({

            success:
                true,

            count:
                monthlyTasks.length,

            dailyTasks:
                monthlyTasks
        });


    } catch (error) {

        console.error(
            "Get Daily Tasks Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch daily tasks",

            error:
                error.message
        });
    }
};


// ==========================================================
// GET DAILY TASK BY ID
// ==========================================================

const getDailyTaskById = async (
    req,
    res
) => {

    try {

        const {
            month,
            year
        } = getMonthYear(req);


        const task =
            await DailyTask.findOne({

                _id:
                    req.params.id,

                user:
                    req.user
            });


        if (!task) {

            return res.status(404).json({

                message:
                    "Daily task not found"
            });
        }


        const version =
            getTaskVersionForMonth(
                task,
                month,
                year
            );


        if (
            !version ||
            version.deleted
        ) {

            return res.status(404).json({

                message:
                    "Task does not exist for this month"
            });
        }


        return res.status(200).json({

            success:
                true,

            dailyTask: {

                _id:
                    task._id,

                user:
                    task.user,

                title:
                    version.title,

                startTime:
                    version.startTime,

                endTime:
                    version.endTime
            }
        });


    } catch (error) {

        console.error(
            "Get Daily Task Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch daily task",

            error:
                error.message
        });
    }
};


// ==========================================================
// UPDATE DAILY TASK
// ==========================================================
//
// Editing October creates/updates ONLY October's version.
// November remains completely independent.
//


const updateDailyTask = async (
    req,
    res
) => {

    try {

        const {
            title,
            startTime = "",
            endTime = ""
        } = req.body;


        const {
            month,
            year
        } = getMonthYear(req);


        if (!title || !title.trim()) {

            return res.status(400).json({

                message:
                    "Task title is required"
            });
        }


        const task =
            await DailyTask.findOne({

                _id:
                    req.params.id,

                user:
                    req.user
            });


        if (!task) {

            return res.status(404).json({

                message:
                    "Daily task not found"
            });
        }


        // ==================================================
        // FIND EXACT MONTH VERSION
        // ==================================================

        const versionIndex =
            (task.monthlyVersions || [])
                .findIndex(
                    (item) =>
                        Number(item.month) ===
                            Number(month) &&
                        Number(item.year) ===
                            Number(year)
                );


        const newVersion = {

            year,

            month,

            title:
                title.trim(),

            startTime,

            endTime,

            deleted:
                false
        };


        // Update existing month

        if (
            versionIndex !== -1
        ) {

            task.monthlyVersions[
                versionIndex
            ] = newVersion;

        } else {

            // Create new month version

            task.monthlyVersions.push(
                newVersion
            );
        }


        await task.save();


        return res.status(200).json({

            success:
                true,

            message:
                "Daily task updated successfully",

            dailyTask: {

                _id:
                    task._id,

                title:
                    title.trim(),

                startTime,

                endTime
            }
        });


    } catch (error) {

        console.error(
            "Update Daily Task Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to update daily task",

            error:
                error.message
        });
    }
};


// ==========================================================
// DELETE DAILY TASK FOR SELECTED MONTH ONLY
// ==========================================================
//
// IMPORTANT:
// We DO NOT delete the DailyTask document.
// We DO NOT delete completion records.
//
// We simply mark this month's version as deleted.
//
// Therefore:
//
// October task -> still exists in October
// November delete -> only November disappears
// October completion history -> untouched
//


const deleteDailyTask = async (
    req,
    res
) => {

    try {

        const {
            month,
            year
        } = getMonthYear(req);


        const task =
            await DailyTask.findOne({

                _id:
                    req.params.id,

                user:
                    req.user
            });


        if (!task) {

            return res.status(404).json({

                message:
                    "Daily task not found"
            });
        }


        // ==================================================
        // FIND EXACT MONTH VERSION
        // ==================================================

        let versionIndex =
            (task.monthlyVersions || [])
                .findIndex(
                    (item) =>
                        Number(item.month) ===
                            Number(month) &&
                        Number(item.year) ===
                            Number(year)
                );


        // ==================================================
        // IF NO VERSION EXISTS
        // CREATE A DELETED VERSION
        // ==================================================

        if (
            versionIndex === -1
        ) {

            task.monthlyVersions.push({

                year,

                month,

                title:
                    task.title || "Deleted Task",

                startTime:
                    task.startTime || "",

                endTime:
                    task.endTime || "",

                deleted:
                    true
            });

        } else {

            // ==================================================
            // MARK ONLY THIS MONTH AS DELETED
            // ==================================================

            task.monthlyVersions[
                versionIndex
            ].deleted = true;
        }


        await task.save();


        // ==================================================
        // IMPORTANT:
        // DO NOT DELETE COMPLETION RECORDS
        // ==================================================


        return res.status(200).json({

            success:
                true,

            message:
                "Task deleted for selected month only"
        });


    } catch (error) {

        console.error(
            "Delete Daily Task Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to delete daily task",

            error:
                error.message
        });
    }
};


// ==========================================================
// GET DAILY TASKS WITH COMPLETIONS
// ==========================================================

const getDailyTasksWithCompletions =
    async (
        req,
        res
    ) => {

        try {

            const {
                month,
                year
            } = getMonthYear(req);


            const tasks =
                await DailyTask.find({

                    user:
                        req.user

                }).sort({

                    createdAt:
                        1
                });


            // ==================================================
            // ONLY SELECTED MONTH TASKS
            // ==================================================

            const monthlyTasks = [];


            tasks.forEach(
                (task) => {

                    const version =
                        getTaskVersionForMonth(
                            task,
                            month,
                            year
                        );


                    if (!version) {
                        return;
                    }


                    if (version.deleted) {
                        return;
                    }


                    monthlyTasks.push({

                        _id:
                            task._id,

                        user:
                            task.user,

                        title:
                            version.title,

                        startTime:
                            version.startTime,

                        endTime:
                            version.endTime,

                        active:
                            true,

                        createdAt:
                            task.createdAt,

                        updatedAt:
                            task.updatedAt
                    });
                }
            );


            // ==================================================
            // GET COMPLETIONS
            // ==================================================

            const completions =
                await DailyTaskCompletion.find({

                    user:
                        req.user

                });


            return res.status(200).json({

                success:
                    true,

                count:
                    monthlyTasks.length,

                dailyTasks:
                    monthlyTasks,

                completions

            });


        } catch (error) {

            console.error(
                "Get Daily Tasks With Completions Error:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to fetch daily tasks",

                error:
                    error.message
            });
        }
    };


// ==========================================================
// TOGGLE DAILY TASK COMPLETION
// ==========================================================

const toggleDailyTaskCompletion =
    async (
        req,
        res
    ) => {

        try {

            const {
                id,
                date
            } = req.params;


            const task =
                await DailyTask.findOne({

                    _id:
                        id,

                    user:
                        req.user
                });


            if (!task) {

                return res.status(404).json({

                    message:
                        "Daily task not found"
                });
            }


            // ==================================================
            // CHECK IF COMPLETION ALREADY EXISTS
            // ==================================================

            const existingCompletion =
                await DailyTaskCompletion.findOne({

                    user:
                        req.user,

                    dailyTask:
                        id,

                    date
                });


            // ==================================================
            // IF EXISTS -> TOGGLE
            // ==================================================

            if (
                existingCompletion
            ) {

                existingCompletion.completed =
                    !existingCompletion.completed;


                await existingCompletion.save();


                return res.status(200).json({

                    success:
                        true,

                    completed:
                        existingCompletion.completed
                });
            }


            // ==================================================
            // OTHERWISE CREATE COMPLETION
            // ==================================================

            const completion =
                await DailyTaskCompletion.create({

                    user:
                        req.user,

                    dailyTask:
                        id,

                    date,

                    completed:
                        true
                });


            return res.status(200).json({

                success:
                    true,

                completed:
                    completion.completed
            });


        } catch (error) {

            console.error(
                "Toggle Completion Error:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to update task completion",

                error:
                    error.message
            });
        }
    };


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

    createDailyTask,

    getDailyTasks,

    getDailyTaskById,

    updateDailyTask,

    deleteDailyTask,

    getDailyTasksWithCompletions,

    toggleDailyTaskCompletion
};