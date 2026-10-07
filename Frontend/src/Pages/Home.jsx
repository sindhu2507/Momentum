import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { Link } from "react-router-dom";
import {
    DndContext,
    closestCenter
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import {
    CSS
} from "@dnd-kit/utilities";
import "./Home.css";
const API_URL = "http://localhost:5000/api/tasks";
const DAILY_TASKS_API_URL = "http://localhost:5000/api/daily-tasks";
const PROFILE_API = "http://localhost:5000/api/auth/me";
/* =========================================================
   DATE HELPER
========================================================= */
function getDateKey(date) {
    const year =
        date.getFullYear();
    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");
    const day =
        String(
            date.getDate()
        ).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
/* =========================================================
   SORTABLE TASK
========================================================= */
function SortableTask({
    task,
    index,
    toggleTask,
    deleteTask,
    openTaskMenu,
    setOpenTaskMenu,
    editingTaskId,
    editingTaskTitle,
    editingTaskPriority,
    setEditingTaskTitle,
    setEditingTaskPriority,
    startEditingTask,
    cancelEditingTask,
    saveEditedTask
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: task._id.toString()
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const priority = String(
        task.priority || "MEDIUM"
    ).toUpperCase();

    const priorityLabel = ["HIGH", "MEDIUM", "LOW"].includes(priority)
        ? priority.charAt(0) + priority.slice(1).toLowerCase()
        : "Medium";

    const priorityClass = ["HIGH", "MEDIUM", "LOW"].includes(priority)
        ? priority.toLowerCase()
        : "medium";

    const isEditing = editingTaskId === task._id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="task-row"
        >
            {/* DRAG HANDLE */}
            {!isEditing && (
                <span
                    className="drag-handle"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                >
                    ☰
                </span>
            )}

            {isEditing ? (
                /* ================= EDIT MODE ================= */
                <div className="task-edit-container">

                    <input
                        type="text"
                        className="task-edit-input"
                        value={editingTaskTitle}
                        onChange={(e) =>
                            setEditingTaskTitle(e.target.value)
                        }
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                saveEditedTask(task);
                            }

                            if (e.key === "Escape") {
                                cancelEditingTask();
                            }
                        }}
                    />

                    <select
                        className="task-edit-priority"
                        value={editingTaskPriority}
                        onChange={(e) =>
                            setEditingTaskPriority(e.target.value)
                        }
                    >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    <button
                        type="button"
                        className="edit-save-btn"
                        onClick={() => saveEditedTask(task)}
                    >
                        Save
                    </button>

                    <button
                        type="button"
                        className="edit-cancel-btn"
                        onClick={cancelEditingTask}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    {/* TASK TITLE */}
                    <span className="task-text">
                        {task.title}
                    </span>

                    {/* RIGHT CONTROLS */}
                    <div className="task-right-controls">

                        <span
                            className={`priority-badge priority-${priorityClass}`}
                        >
                            {priorityLabel}
                        </span>

                        <div className="task-actions">

                            {/* COMPLETE */}
                            <button
                                type="button"
                                className="task-action task-complete-btn"
                                onClick={() => toggleTask(task._id)}
                                title="Complete task"
                                aria-label="Complete task"
                            >
                                ✓
                            </button>

                            {/* THREE DOT MENU */}
                            <div className="task-menu-wrapper">

                                <button
                                    type="button"
                                    className={`task-action task-menu-btn ${
                                        openTaskMenu === task._id
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        setOpenTaskMenu(
                                            openTaskMenu === task._id
                                                ? null
                                                : task._id
                                        );
                                    }}
                                    title="More options"
                                    aria-label="More options"
                                >
                                    ⋯
                                </button>

                                {openTaskMenu === task._id && (
                                    <div className="task-menu">

                                        <button
                                            type="button"
                                            className="task-menu-item"
                                            onClick={() =>
                                                startEditingTask(task)
                                            }
                                        >
                                            
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="task-menu-item delete-option"
                                            onClick={() => {
                                                setOpenTaskMenu(null);
                                                deleteTask(task._id);
                                            }}
                                        >
                                            
                                            Delete
                                        </button>

                                    </div>
                                )}

                            </div>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
/* =========================================================
   HOME COMPONENT
========================================================= */
function Home() {
    const today = new Date();
    const todayKey =
        getDateKey(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowKey =
        getDateKey(tomorrow);
    const [tasks, setTasks] =
        useState([]);
    const [newTask, setNewTask] =
        useState("");
    const [newTaskPriority, setNewTaskPriority] =
        useState("");
    const [tomorrowTask, setTomorrowTask] =
        useState("");
    const [tomorrowTaskPriority, setTomorrowTaskPriority] =
        useState("");
    const [showTomorrowTasks, setShowTomorrowTasks] =
        useState(false);
    const [openTaskMenu, setOpenTaskMenu] = useState(null);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState("");
    const [editingTaskPriority, setEditingTaskPriority] = useState("");
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const [dailyTasks, setDailyTasks] = useState([]);
    const [dailyTaskCompletions, setDailyTaskCompletions] = useState([]);
    const [dailyTasksLoading, setDailyTasksLoading] = useState(true);
    const [dailyTasksError, setDailyTasksError] = useState("");
    const taskInputRef =
        useRef(null);
    const tomorrowTaskInputRef =
        useRef(null);
    const [name, setName] = useState("");
        const [profileLoading, setProfileLoading] = useState(true);
/* =========================================================
       GET AUTH TOKEN
    ========================================================= */
    const getToken = () => {
        return localStorage.getItem(
            "token"
        );
    };
    const loadProfile = async () => {
            try {
                const token = getToken();

                if (!token) {
                    setProfileLoading(false);
                return;
                }

                const response = await fetch(PROFILE_API, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load profile"
                    );
                }

                const user = data.user;

                setName(user.name || "");
            } catch (error) {
                console.error("Unable to load profile:", error);
            } finally {
                setProfileLoading(false);
            }
        };
    /* =========================================================
       LOAD TASKS FROM BACKEND
    ========================================================= */
    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");
            const token =
                getToken();
            if (!token) {
                setError(
                    "You are not logged in."
                );
                setLoading(false);
                return;
            }
            const response =
                await fetch(
                    API_URL,
                    {
                        method: "GET",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load tasks"
                );
            }
            setTasks(
                data.tasks || []
            );
        } catch (error) {
            console.error(
                "Unable to load tasks:",
                error
            );
            setError(
                error.message
            );
        } finally {
            setLoading(false);
        }
    };
    /* =========================================================
       LOAD TODAY'S TIMETABLE FROM DAILY TASKS
    ========================================================= */
    const loadDailyTasks = async () => {
        try {
            setDailyTasksLoading(true);
            setDailyTasksError("");
            const token = getToken();
            if (!token) {
                setDailyTasksError("Please log in to view your timetable.");
                return;
            }
            const response = await fetch(
                `${DAILY_TASKS_API_URL}/with-completions`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to load today's timetable.");
            }
            const sortedTasks = [...(data.dailyTasks || [])].sort((a, b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            });
            setDailyTasks(sortedTasks);
            setDailyTaskCompletions(data.completions || []);
        } catch (error) {
            console.error("Unable to load daily timetable:", error);
            setDailyTasksError(error.message);
        } finally {
            setDailyTasksLoading(false);
        }
    };
    /* =========================================================
   TOGGLE DAILY TASK COMPLETION
========================================================= */
const toggleDailyTask = async (taskId) => {
    const token = getToken();
    if (!token) {
        alert("Please log in again.");
        return;
    }
    // Check the current completion status
    const wasCompleted = dailyTaskCompletions.some(
        (completion) => {
            const completionTaskId =
                typeof completion.dailyTask === "object"
                    ? completion.dailyTask?._id
                    : completion.dailyTask;
            return (
                String(completionTaskId) === String(taskId) &&
                completion.date === todayKey
            );
        }
    );
    // Save the previous state in case the API request fails
    const previousCompletions = dailyTaskCompletions;
    // Update the tick immediately
    setDailyTaskCompletions((prev) => {
        if (wasCompleted) {
            // Remove today's completion
            return prev.filter((completion) => {
                const completionTaskId =
                    typeof completion.dailyTask === "object"
                        ? completion.dailyTask?._id
                        : completion.dailyTask;
                return !(
                    String(completionTaskId) === String(taskId) &&
                    completion.date === todayKey
                );
            });
        }
        // Add today's completion locally
        return [
            ...prev,
            {
                dailyTask: taskId,
                date: todayKey
            }
        ];
    });
    try {
        const response = await fetch(
            `${DAILY_TASKS_API_URL}/${taskId}/completion/${todayKey}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        if (!response.ok) {
            throw new Error(
                data.message || "Failed to update completion"
            );
        }
    } catch (error) {
        console.error(
            "Failed to update daily task:",
            error
        );
        // Restore the previous tick state if saving fails
        setDailyTaskCompletions(previousCompletions);
        alert("Couldn't save the change. Please try again.");
    }
};
    /* =========================================================
       INITIAL LOAD
    ========================================================= */
    useEffect(() => {
        loadTasks();
        loadDailyTasks();
        loadProfile();
    }, []);
    /* =========================================================
       TODAY'S TASKS
    ========================================================= */
    const todaysTasks =
        useMemo(() => {
            return tasks.filter(
                (task) =>
                    task.date ===
                    todayKey
            );
        }, [
            tasks,
            todayKey
        ]);
    /* =========================================================
       PENDING TASKS
    ========================================================= */
    const pendingTasks =
        todaysTasks.filter(
            (task) =>
                task.status !==
                "COMPLETED"
        );
    /* =========================================================
       COMPLETED TASKS
    ========================================================= */
    const completedTasks =
        todaysTasks.filter(
            (task) =>
                task.status ===
                "COMPLETED"
        );
    /* =========================================================
       ADD TASK
    ========================================================= */
    /* =========================================================
       TOMORROW'S TASKS
    ========================================================= */
    const tomorrowsTasks =
        useMemo(() => {
            return tasks.filter(
                (task) => task.date === tomorrowKey
            );
        }, [tasks, tomorrowKey]);
    const tomorrowPendingTasks =
        tomorrowsTasks.filter(
            (task) => task.status !== "COMPLETED"
        );
    const tomorrowCompletedTasks =
        tomorrowsTasks.filter(
            (task) => task.status === "COMPLETED"
        );
    const addTask = async () => {
        const taskText =
            newTask.trim();
        if (!taskText) {
            return;
        }
        try {
            setError("");
            const token =
                getToken();
            if (!token) {
                setError(
                    "You are not logged in."
                );
                return;
            }
            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body:
                            JSON.stringify({
                                title:
                                    taskText,
                                date:
                                    todayKey,
                                priority:
                                    newTaskPriority,
                                status:
                                    "TODO"
                            })
                    }
                );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create task"
                );
            }
            /*
             * Add the newly-created
             * MongoDB task to state.
             */
            setTasks(
                (previousTasks) => [
                    ...previousTasks,
                    data.task
                ]
            );
            setNewTask("");
            setNewTaskPriority("");
            /*
             * Keep focus on input.
             */
            setTimeout(() => {
                taskInputRef.current?.focus();
            }, 0);
        } catch (error) {
            console.error(
                "Unable to create task:",
                error
            );
            setError(
                error.message
            );
        }
    };
    /* =========================================================
       TOGGLE TASK
    ========================================================= */
    /* =========================================================
       ADD TOMORROW'S TASK
    ========================================================= */
    const addTomorrowTask = async () => {
        const taskText = tomorrowTask.trim();
        if (!taskText) return;
        try {
            setError("");
            const token = getToken();
            if (!token) {
                setError("You are not logged in.");
                return;
            }
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: taskText,
                    date: tomorrowKey,
                    priority: tomorrowTaskPriority,
                    status: "TODO"
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to create tomorrow's task"
                );
            }
            setTasks((previousTasks) => [
                ...previousTasks,
                data.task
            ]);
            setTomorrowTask("");
            setTomorrowTaskPriority("");
            setTimeout(() => {
                tomorrowTaskInputRef.current?.focus();
            }, 0);
        } catch (error) {
            console.error(
                "Unable to create tomorrow's task:",
                error
            );
            setError(error.message);
        }
    };
    const toggleTask = async (
        taskId
    ) => {
        try {
            setError("");
            const token =
                getToken();
            if (!token) {
                setError(
                    "You are not logged in."
                );
                return;
            }
            const task =
                tasks.find(
                    (item) =>
                        item._id ===
                        taskId
                );
            if (!task) {
                return;
            }
            const newStatus =
                task.status ===
                "COMPLETED"
                    ? "TODO"
                    : "COMPLETED";
            const response =
                await fetch(
                    `${API_URL}/${taskId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body:
                            JSON.stringify({
                                title:
                                    task.title,
                                date:
                                    task.date,
                                priority:
                                    task.priority,
                                status:
                                    newStatus
                            })
                    }
                );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to update task"
                );
            }
            setTasks(
                (previousTasks) =>
                    previousTasks.map(
                        (item) =>
                            item._id ===
                            taskId
                                ? data.task
                                : item
                    )
            );
        } catch (error) {
            console.error(
                "Unable to update task:",
                error
            );
            setError(
                error.message
            );
        }
    };
    const startEditingTask = (task) => {
        setEditingTaskId(task._id);
        setEditingTaskTitle(task.title || "");
        setEditingTaskPriority(task.priority || "MEDIUM");
        setOpenTaskMenu(null);
    };

    const cancelEditingTask = () => {
        setEditingTaskId(null);
        setEditingTaskTitle("");
        setEditingTaskPriority("");
    };

    const saveEditedTask = async (task) => {
        try {
            setError("");

            const token = getToken();

            if (!token) {
                setError("You are not logged in.");
                return;
            }

            const updatedTitle = editingTaskTitle.trim();

            if (!updatedTitle) {
                setError("Task name cannot be empty.");
                return;
            }

            const response = await fetch(`${API_URL}/${task._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: updatedTitle,
                    date: task.date,
                    priority: editingTaskPriority,
                    status: task.status
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update task"
                );
            }

            setTasks((previousTasks) =>
                previousTasks.map((item) =>
                    item._id === task._id
                        ? data.task
                        : item
                )
            );

            cancelEditingTask();

        } catch (error) {
            console.error("Unable to edit task:", error);
            setError(error.message);
        }
    };
    /* =========================================================
       DELETE TASK
    ========================================================= */
    const deleteTask = async (
        taskId
    ) => {
        try {
            setError("");
            const token =
                getToken();
            if (!token) {
                setError(
                    "You are not logged in."
                );
                return;
            }
            const response =
                await fetch(
                    `${API_URL}/${taskId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete task"
                );
            }
            setTasks(
                (previousTasks) =>
                    previousTasks.filter(
                        (task) =>
                            task._id !==
                            taskId
                    )
            );
        } catch (error) {
            console.error(
                "Unable to delete task:",
                error
            );
            setError(
                error.message
            );
        }
    };
    /* =========================================================
       DRAG & DROP
    ========================================================= */
    const handleDragEnd = async (
        event
    ) => {
        const {
            active,
            over
        } = event;
        if (
            !over ||
            active.id ===
            over.id
        ) {
            return;
        }
        const oldIndex =
            pendingTasks.findIndex(
                (task) =>
                    task._id.toString() ===
                    active.id
            );
        const newIndex =
            pendingTasks.findIndex(
                (task) =>
                    task._id.toString() ===
                    over.id
            );
        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }
        /*
         * Reorder pending tasks locally.
         */
        const reorderedPending =
            arrayMove(
                pendingTasks,
                oldIndex,
                newIndex
            );
        // Reorder the task list locally without changing its HIGH/MEDIUM/LOW priority.
        // Persisting custom order requires a separate sortOrder field in the backend.
        const updatedTasks = [
            ...tasks.filter((task) => task.date !== todayKey),
            ...reorderedPending,
            ...completedTasks
        ];
        setTasks(updatedTasks);
    };
    const profileInitial = name
    ? name.trim().charAt(0).toUpperCase()
    : "";


    /* =========================================================
       RENDER
    ========================================================= */
    return (
        <div className="main-layout">
            <div className="home">
                {/* =================================================
                    NAVBAR
                ================================================= */}
                <nav className="navbar">
                    <div className="nav-left">
                        <h2 className="home-logo">
                            Momentum
                        </h2>
                        <div className="nav-menu">
                            <Link
                                to="/home"
                                className="menu-btn active"
                            >
                                Home
                            </Link>
                            <Link
                                to="/daily"
                                className="menu-btn"
                            >
                                Daily Tasks
                            </Link>
                            <Link
                                to="/timetable"
                                className="menu-btn"
                            >
                                Timetable Planner
                            </Link>
                            <Link
                                to="/calendar"
                                className="menu-btn"
                            >
                                Calendar
                            </Link>
                            <Link
                                to="/analytics"
                                className="menu-btn"
                            >
                                Analytics
                            </Link>
                        </div>
                    </div>
                    <div className="nav-right">
                        
                        <Link
                            to="/profile"
                            className="profile-link"
                        >
                            <div className="navbar-profile">
                                {profileLoading ? "" : profileInitial}
                            </div>
                        </Link>
                    </div>
                </nav>
                <div className="home-content-grid">
                    <div className="home-left-column">
                {/* =================================================
                    TODAY HEADER
                ================================================= */}
                <div className="home-date-header">
                    <div>
                        <h1>
                            {today.toLocaleDateString(
                                "en-US",
                                {
                                    weekday:
                                        "long",
                                    month:
                                        "long",
                                    day:
                                        "numeric"
                                }
                            )}
                        </h1>
                    </div>
                </div>
                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}
                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}
                {/* =================================================
                    ADD TASK
                ================================================= */}
                <section className="add-task-box">
                    <input
                        ref={taskInputRef}
                        type="text"
                        placeholder="Enter new task..."
                        value={newTask}
                        onChange={(e) =>
                            setNewTask(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key ===
                                "Enter"
                            ) {
                                e.preventDefault();
                                addTask();
                            }
                        }}
                        className="task-input"
                    />
                    <select
                        className="task-priority-select"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        >
                        <option value="" disabled>
                            Priority
                        </option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <button
                        type="button"
                        onClick={
                            addTask
                        }
                        className="add-btn"
                        disabled={loading}
                    >
                        + Add Task
                    </button>
                </section>
                {/* SINGLE TASK LIST */}
                <section className="task-container">
                    <div className="task-card">
                        <div className="task-card-header">
                            <div>
                                <h2>Today's Tasks</h2>
                                <p className="task-list-subtitle">Keep moving, one task at a time.</p>
                            </div>
                            <span className="section-count">{todaysTasks.length}</span>
                        </div>
                        {loading ? (
                            <p className="empty-text">Loading tasks...</p>
                        ) : todaysTasks.length === 0 ? (
                            <p className="empty-text">No tasks for today. Add one above to get started.</p>
                        ) : (
                            <>
                                {pendingTasks.length > 0 && (
                                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext
                                            items={pendingTasks.map((task) => task._id.toString())}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {pendingTasks.map((task, index) => (
                                                <SortableTask
                                                    key={task._id}
                                                    task={task}
                                                    index={index}
                                                    toggleTask={toggleTask}
                                                    deleteTask={deleteTask}
                                                    openTaskMenu={openTaskMenu}
                                                    setOpenTaskMenu={setOpenTaskMenu}
                                                    editingTaskId={editingTaskId}
                                                    editingTaskTitle={editingTaskTitle}
                                                    editingTaskPriority={editingTaskPriority}
                                                    setEditingTaskTitle={setEditingTaskTitle}
                                                    setEditingTaskPriority={setEditingTaskPriority}
                                                    startEditingTask={startEditingTask}
                                                    cancelEditingTask={cancelEditingTask}
                                                    saveEditedTask={saveEditedTask}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}
                                {completedTasks.length > 0 && (
                                    <div className="completed-task-group">
                                        <div className="completed-divider">
                                            <span>Completed</span>
                                            <span className="completed-count">{completedTasks.length}</span>
                                        </div>
                                        {completedTasks.map((task) => {
                                            const priority = String(task.priority || "MEDIUM").toUpperCase();
                                            const priorityLabel = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                ? priority.charAt(0) + priority.slice(1).toLowerCase()
                                                : "Medium";
                                            const priorityClass = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                ? priority.toLowerCase()
                                                : "medium";
                                            return (
                                            <div key={task._id} className="task-row completed">
                                                <span className="task-text">{task.title}</span>
                                                <div className="task-right-controls">
                                                    <span className={`priority-badge priority-${priorityClass}`}>{priorityLabel}</span>
                                                    <div className="task-actions">
                                                        <button
                                                            type="button"
                                                            className="task-action task-complete-btn active"
                                                            onClick={() => toggleTask(task._id)}
                                                            title="Mark as incomplete"
                                                            aria-label="Mark as incomplete"
                                                        >✓</button>
                                                        <div className="task-menu-wrapper">

                                                            <button
                                                                type="button"
                                                                className={`task-action task-menu-btn ${
                                                                    openTaskMenu === task._id
                                                                        ? "active"
                                                                        : ""
                                                                }`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();

                                                                    setOpenTaskMenu(
                                                                        openTaskMenu === task._id
                                                                            ? null
                                                                            : task._id
                                                                    );
                                                                }}
                                                                title="More options"
                                                                aria-label="More options"
                                                            >
                                                                ⋯
                                                            </button>

                                                            {openTaskMenu === task._id && (
                                                                <div className="task-menu">

                                                                    <button
                                                                        type="button"
                                                                        className="task-menu-item"
                                                                        onClick={() =>
                                                                            startEditingTask(task)
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="task-menu-item delete-option"
                                                                        onClick={() => {
                                                                            setOpenTaskMenu(null);
                                                                            deleteTask(task._id);
                                                                        }}
                                                                    >
                                                                       
                                                                        Delete
                                                                    </button>

                                                                </div>
                                                            )}

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                {/* =================================================
                    TOMORROW'S TASKS
                ================================================= */}
                <section className="tomorrow-tasks-wrapper">
                    <button
                        type="button"
                        className={showTomorrowTasks ? "tomorrow-toggle-btn open" : "tomorrow-toggle-btn"}
                        onClick={() => {
                            const willOpen = !showTomorrowTasks;
                            setShowTomorrowTasks(willOpen);
                            if (willOpen) {
                                setTimeout(() => {
                                    tomorrowTaskInputRef.current?.focus();
                                }, 0);
                            }
                        }}
                    >
                        <span className="tomorrow-toggle-icon">
                            {showTomorrowTasks ? "−" : "+"}
                        </span>
                        <span>Add Tomorrow's Tasks</span>
                        <span className="tomorrow-toggle-date">
                            {tomorrow.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                            })}
                        </span>
                    </button>
                    {showTomorrowTasks && (
                        <section className="tomorrow-task-card">
                            <div className="task-card-header tomorrow-card-header">
                                <div>
                                    <h2>Tomorrow's Tasks</h2>
                                    <p className="task-list-subtitle">
                                        Plan ahead and make tomorrow easier.
                                    </p>
                                </div>
                                <span className="section-count">
                                    {tomorrowsTasks.length}
                                </span>
                            </div>
                            <div className="tomorrow-add-task-box">
                                <input
                                    ref={tomorrowTaskInputRef}
                                    type="text"
                                    placeholder="Enter tomorrow's task..."
                                    value={tomorrowTask}
                                    onChange={(e) => setTomorrowTask(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTomorrowTask();
                                        }
                                    }}
                                    className="task-input"
                                />
                                <select
                                    className="task-priority-select"
                                    value={tomorrowTaskPriority}
                                    onChange={(e) => setTomorrowTaskPriority(e.target.value)}
                                >
                                    <option value="" disabled>Priority</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addTomorrowTask}
                                    className="add-btn"
                                >
                                    + Add Task
                                </button>
                            </div>
                            <div className="tomorrow-task-list">
                                {tomorrowsTasks.length === 0 ? (
                                    <p className="empty-text">
                                        No tasks planned for tomorrow yet.
                                    </p>
                                ) : (
                                    <>
                                        {tomorrowPendingTasks.map((task) => {
                                            const priority = String(task.priority || "MEDIUM").toUpperCase();
                                            const priorityLabel = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                ? priority.charAt(0) + priority.slice(1).toLowerCase()
                                                : "Medium";
                                            const priorityClass = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                ? priority.toLowerCase()
                                                : "medium";
                                            return (
                                              <div
                                                    key={task._id}
                                                    className="task-row tomorrow-task-row"
                                                >
                                                    {editingTaskId === task._id ? (
                                                        /* ================= EDIT MODE ================= */
                                                        <div className="task-edit-container">

                                                            <input
                                                                type="text"
                                                                className="task-edit-input"
                                                                value={editingTaskTitle}
                                                                onChange={(e) =>
                                                                    setEditingTaskTitle(e.target.value)
                                                                }
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        saveEditedTask(task);
                                                                    }

                                                                    if (e.key === "Escape") {
                                                                        e.preventDefault();
                                                                        cancelEditingTask();
                                                                    }
                                                                }}
                                                            />

                                                            <select
                                                                className="task-edit-priority"
                                                                value={editingTaskPriority}
                                                                onChange={(e) =>
                                                                    setEditingTaskPriority(e.target.value)
                                                                }
                                                            >
                                                                <option value="HIGH">High</option>
                                                                <option value="MEDIUM">Medium</option>
                                                                <option value="LOW">Low</option>
                                                            </select>

                                                            <button
                                                                type="button"
                                                                className="edit-save-btn"
                                                                onClick={() => saveEditedTask(task)}
                                                            >
                                                                Save
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="edit-cancel-btn"
                                                                onClick={cancelEditingTask}
                                                            >
                                                                Cancel
                                                            </button>

                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="task-text">
                                                                {task.title}
                                                            </span>

                                                            <div className="task-right-controls">

                                                                <span
                                                                    className={`priority-badge priority-${priorityClass}`}
                                                                >
                                                                    {priorityLabel}
                                                                </span>

                                                                <div className="task-actions">

                                                                    {/* COMPLETE */}
                                                                    <button
                                                                        type="button"
                                                                        className="task-action task-complete-btn"
                                                                        onClick={() =>
                                                                            toggleTask(task._id)
                                                                        }
                                                                        title="Complete task"
                                                                        aria-label="Complete task"
                                                                    >
                                                                        ✓
                                                                    </button>

                                                                    {/* THREE DOT MENU */}
                                                                    <div className="task-menu-wrapper">

                                                                        <button
                                                                            type="button"
                                                                            className={`task-action task-menu-btn ${
                                                                                openTaskMenu === task._id
                                                                                    ? "active"
                                                                                    : ""
                                                                            }`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();

                                                                                setOpenTaskMenu(
                                                                                    openTaskMenu === task._id
                                                                                        ? null
                                                                                        : task._id
                                                                                );
                                                                            }}
                                                                            title="More options"
                                                                            aria-label="More options"
                                                                        >
                                                                            ⋯
                                                                        </button>

                                                                        {openTaskMenu === task._id && (
                                                                            <div className="task-menu">

                                                                                {/* EDIT */}
                                                                                <button
                                                                                    type="button"
                                                                                    className="task-menu-item"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        startEditingTask(task);
                                                                                    }}
                                                                                >
                                                                                    
                                                                                    Edit
                                                                                </button>

                                                                                {/* DELETE */}
                                                                                <button
                                                                                    type="button"
                                                                                    className="task-menu-item delete-option"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenTaskMenu(null);
                                                                                        deleteTask(task._id);
                                                                                    }}
                                                                                >
                                                                                    Delete
                                                                                </button>

                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </div>
                                                        </>
                                                    )}
                                                </div>  
                                            );
                                        })}
                                        {tomorrowCompletedTasks.length > 0 && (
                                            <div className="completed-task-group">
                                                <div className="completed-divider">
                                                    <span>Completed</span>
                                                    <span className="completed-count">
                                                        {tomorrowCompletedTasks.length}
                                                    </span>
                                                </div>
                                                {tomorrowCompletedTasks.map((task) => {
                                                    const priority = String(task.priority || "MEDIUM").toUpperCase();
                                                    const priorityLabel = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                        ? priority.charAt(0) + priority.slice(1).toLowerCase()
                                                        : "Medium";
                                                    const priorityClass = ["HIGH", "MEDIUM", "LOW"].includes(priority)
                                                        ? priority.toLowerCase()
                                                        : "medium";
                                                    return (
                                                        <div key={task._id} className="task-row completed tomorrow-task-row">
                                                            <span className="task-text">{task.title}</span>
                                                            <div className="task-right-controls">
                                                                <span className={`priority-badge priority-${priorityClass}`}>
                                                                    {priorityLabel}
                                                                </span>
                                                                <div className="task-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="task-action task-complete-btn active"
                                                                        onClick={() => toggleTask(task._id)}
                                                                        title="Mark as incomplete"
                                                                        aria-label="Mark as incomplete"
                                                                    >✓</button>
                                                                    <div className="task-menu-wrapper">

                                                                        <button
                                                                            type="button"
                                                                            className={`task-action task-menu-btn ${
                                                                                openTaskMenu === task._id ? "active" : ""
                                                                            }`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();

                                                                                setOpenTaskMenu(
                                                                                    openTaskMenu === task._id
                                                                                        ? null
                                                                                        : task._id
                                                                                );
                                                                            }}
                                                                            title="More options"
                                                                            aria-label="More options"
                                                                        >
                                                                            ⋯
                                                                        </button>

                                                                        {openTaskMenu === task._id && (
                                                                            <div className="task-menu">

                                                                                <button
                                                                                    type="button"
                                                                                    className="task-menu-item"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        startEditingTask(task);
                                                                                    }}
                                                                                >
                                                                                   
                                                                                    Edit
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    className="task-menu-item delete-option"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenTaskMenu(null);
                                                                                        deleteTask(task._id);
                                                                                    }}
                                                                                >
                                                                                   
                                                                                    Delete
                                                                                </button>

                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>
                    )}
                </section>
                    </div>
                </section>
                    </div>
                    {/* ================= DAILY TASKS TABLE ================= */}
                    <section className="today-timetable-card">
                        <div className="today-timetable-table-wrap">
                            <table className="today-timetable-table">
                                <thead>
                                    <tr>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Task</th>
                                        <th className="today-date-column">
                                            <span>{today.getDate()}</span>
                                            <small>{today.toLocaleDateString("en-US", { weekday: "short" })}</small>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyTasksLoading ? (
                                        <tr><td colSpan="4" className="timetable-state">Loading tasks...</td></tr>
                                    ) : dailyTasksError ? (
                                        <tr><td colSpan="4" className="timetable-state timetable-error">{dailyTasksError}</td></tr>
                                    ) : dailyTasks.length === 0 ? (
                                        <tr><td colSpan="4" className="timetable-state">No daily tasks added yet.</td></tr>
                                    ) : (
                                        dailyTasks.map((task) => {
                                            const isCompleted = dailyTaskCompletions.some((completion) => {
                                                const completionTaskId = typeof completion.dailyTask === "object"
                                                    ? completion.dailyTask?._id
                                                    : completion.dailyTask;
                                                return completionTaskId === task._id && completion.date === todayKey;
                                            });
                                            return (
                                                <tr key={task._id}>
                                                    <td className="today-time-cell">{task.startTime || "--"}</td>
                                                    <td className="today-time-cell">{task.endTime || "--"}</td>
                                                    <td className="today-task-cell">{task.title}</td>
                                                    <td className="today-date-column">
                                                        <button
                                                            type="button"
                                                            className={
                                                                isCompleted
                                                                    ? "home-date-box checked"
                                                                    : "home-date-box"
                                                            }
                                                            onClick={() => toggleDailyTask(task._id)}
                                                            aria-label={
                                                                isCompleted
                                                                    ? `Mark ${task.title} as incomplete`
                                                                    : `Mark ${task.title} as complete`
                                                            }
                                                            title={
                                                                isCompleted
                                                                    ? "Mark as incomplete"
                                                                    : "Mark as complete"
                                                            }
                                                        >
                                                            {isCompleted ? "✓" : ""}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
export default Home;
