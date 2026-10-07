import React, {

    useEffect,

    useMemo,

    useRef,

    useState

} from "react";

import { Link } from "react-router-dom";

import { createPortal } from "react-dom";

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

import "./Calendar.css";

const API_URL = "http://localhost:5000/api/tasks";
const PROFILE_API = "http://localhost:5000/api/auth/me";

/* =========================================================

   DATE HELPERS

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

function isSameDate(date1, date2) {

    return (

        getDateKey(date1) ===

        getDateKey(date2)

    );

}

/* =========================================================

   TASK MENU POSITION HELPER

========================================================= */

function getTaskMenuPosition(buttonElement) {

    if (!buttonElement) {
        return null;
    }

    const rect = buttonElement.getBoundingClientRect();

    const menuWidth = 125;
    const estimatedMenuHeight = 82;
    const gap = 6;
    const viewportPadding = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedMenuHeight + gap;

    const top = openUpward
        ? Math.max(
            viewportPadding,
            rect.top - estimatedMenuHeight - gap
        )
        : Math.min(
            rect.bottom + gap,
            window.innerHeight - estimatedMenuHeight - viewportPadding
        );

    const left = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding
    );

    return { top, left };
}

/* =========================================================

   SORTABLE CALENDAR TASK

========================================================= */

function SortableCalendarTask({

    task,

    index,

    toggleTask,

    deleteTask,

    openTaskMenu,

    setOpenTaskMenu,

    editingTaskId,

    editingTaskTitle,

    setEditingTaskTitle,

    editingTaskPriority,

    setEditingTaskPriority,

    startEditingTask,

    saveEditedTask,

    cancelEditingTask

}) {

    const {

        attributes,

        listeners,

        setNodeRef,

        transform,

        transition

    } = useSortable({

        id:

            task._id.toString()

    });

    const style = {

        transform:

            CSS.Transform.toString(

                transform

            ),

        transition

    };

    const menuButtonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState(null);

    const updateMenuPosition = () => {

        const position = getTaskMenuPosition(menuButtonRef.current);

        if (position) {
            setMenuPosition(position);
        }

    };

    useEffect(() => {

        if (openTaskMenu !== task._id) {
            setMenuPosition(null);
            return undefined;
        }

        updateMenuPosition();

        const handleViewportChange = () => {
            updateMenuPosition();
        };

        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };

    }, [openTaskMenu, task._id]);
    return (

        <div

            ref={setNodeRef}

            style={style}

            className="calendar-task"

        >

            {/* =================================================

                DRAG HANDLE

            ================================================= */}

            <span

                className="calendar-drag-handle"

                {...attributes}

                {...listeners}

                title="Drag to reorder"

            >

                ☰

            </span>

            {editingTaskId === task._id ? (
                <div className="calendar-task-edit-container">
                    <input
                        type="text"
                        className="calendar-task-edit-input"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
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
                        className="calendar-task-edit-priority"
                        value={editingTaskPriority}
                        onChange={(e) => setEditingTaskPriority(e.target.value)}
                    >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    <button
                        type="button"
                        className="calendar-edit-save-btn"
                        onClick={() => saveEditedTask(task)}
                    >
                        Save
                    </button>

                    <button
                        type="button"
                        className="calendar-edit-cancel-btn"
                        onClick={cancelEditingTask}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <span className="calendar-task-text">
                    {task.title}
                </span>
            )}

            {/* =================================================

                PRIORITY

            ================================================= */}

            <span className={`priority-badge priority-${String(task.priority || "MEDIUM").toLowerCase()}`}>

                {String(task.priority || "MEDIUM").charAt(0).toUpperCase() + String(task.priority || "MEDIUM").slice(1).toLowerCase()}

            </span>

            {/* =================================================

                ACTIONS

            ================================================= */}

            <div className="calendar-task-actions">

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

                <div className="calendar-task-menu-wrapper">

                    <button

                        ref={menuButtonRef}

                        type="button"

                        className={`task-action calendar-task-menu-btn ${

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

                    {openTaskMenu === task._id &&
                        menuPosition &&
                        createPortal(
                            <div
                                className="calendar-task-menu calendar-task-menu-portal"
                                style={{
                                    top: menuPosition.top,
                                    left: menuPosition.left
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >

                                <button
                                    type="button"
                                    className="calendar-task-menu-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingTask(task);
                                    }}
                                >
                                    <span>✏️</span>
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    className="calendar-task-menu-item delete-option"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenTaskMenu(null);
                                        deleteTask(task._id);
                                    }}
                                >
                                    <span>🗑️</span>
                                    Delete
                                </button>

                            </div>,
                            document.body
                        )
                    }

                </div>

            </div>

        </div>

    );

}

/* =========================================================

   CALENDAR COMPONENT

========================================================= */

function Calendar() {
    const [name, setName] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);

    const today = new Date();

    /* =========================================================

       STATE

    ========================================================= */

    const [currentDate, setCurrentDate] =

        useState(

            new Date(

                today.getFullYear(),

                today.getMonth(),

                1

            )

        );

    const [selectedDate, setSelectedDate] =

        useState(today);

    const [tasks, setTasks] =

        useState([]);

    const [newTask, setNewTask] =

        useState("");

    const [newTaskPriority, setNewTaskPriority] =

        useState("");

    const [loading, setLoading] =

        useState(true);

    const [error, setError] =

        useState("");

    const [openTaskMenu, setOpenTaskMenu] = useState(null);

    const [editingTaskId, setEditingTaskId] = useState(null);

    const [editingTaskTitle, setEditingTaskTitle] = useState("");

    const [editingTaskPriority, setEditingTaskPriority] = useState("");

    /* =========================================================

       MONTHS

    ========================================================= */

    const monthNames = [

        "January",

        "February",

        "March",

        "April",

        "May",

        "June",

        "July",

        "August",

        "September",

        "October",

        "November",

        "December"

    ];

    /* =========================================================

       WEEK DAYS

    ========================================================= */

    const weekDays = [

        "Su",

        "Mo",

        "Tu",

        "We",

        "Th",

        "Fr",

        "Sa"

    ];

    /* =========================================================

       GET TOKEN

    ========================================================= */

    const getToken = () => {

        return localStorage.getItem(

            "token"

        );

    };

    /* =========================================================

       LOAD TASKS FROM BACKEND

    ========================================================= */

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
                throw new Error(data.message || "Unable to load profile");
            }

            const user = data.user;
            setName(user.name || "");
        } catch (error) {
            console.error("Unable to load profile:", error);
        } finally {
            setProfileLoading(false);
        }
    };

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

       LOAD TASKS WHEN CALENDAR OPENS

    ========================================================= */

    useEffect(() => {

        loadTasks();
        loadProfile();

    }, []);

    /* =========================================================

       PREVIOUS MONTH

    ========================================================= */

    const goToPreviousMonth = () => {

        setCurrentDate(

            new Date(

                currentDate.getFullYear(),

                currentDate.getMonth() - 1,

                1

            )

        );

    };

    /* =========================================================

       NEXT MONTH

    ========================================================= */

    const goToNextMonth = () => {

        setCurrentDate(

            new Date(

                currentDate.getFullYear(),

                currentDate.getMonth() + 1,

                1

            )

        );

    };

    /* =========================================================

       MONTH SELECT

    ========================================================= */

    const handleMonthChange = (e) => {

        setCurrentDate(

            new Date(

                currentDate.getFullYear(),

                Number(e.target.value),

                1

            )

        );

    };

    /* =========================================================

       YEAR SELECT

    ========================================================= */

    const handleYearChange = (e) => {

        setCurrentDate(

            new Date(

                Number(e.target.value),

                currentDate.getMonth(),

                1

            )

        );

    };

    /* =========================================================

       YEAR OPTIONS

    ========================================================= */

    const years = [];

    for (

        let year =

            today.getFullYear() - 5;

        year <=

            today.getFullYear() + 5;

        year++

    ) {

        years.push(year);

    }

    /* =========================================================

       GENERATE CALENDAR DAYS

    ========================================================= */

    const generateCalendarDays = () => {

        const year =

            currentDate.getFullYear();

        const month =

            currentDate.getMonth();

        const firstDay =

            new Date(

                year,

                month,

                1

            ).getDay();

        const daysInMonth =

            new Date(

                year,

                month + 1,

                0

            ).getDate();

        const previousMonthDays =

            new Date(

                year,

                month,

                0

            ).getDate();

        const days = [];

        /* =====================================================

           PREVIOUS MONTH

        ===================================================== */

        for (

            let i =

                firstDay - 1;

            i >= 0;

            i--

        ) {

            const date =

                new Date(

                    year,

                    month - 1,

                    previousMonthDays - i

                );

            days.push({

                day:

                    previousMonthDays - i,

                date,

                currentMonth:

                    false

            });

        }

        /* =====================================================

           CURRENT MONTH

        ===================================================== */

        for (

            let day = 1;

            day <= daysInMonth;

            day++

        ) {

            const date =

                new Date(

                    year,

                    month,

                    day

                );

            days.push({

                day,

                date,

                currentMonth:

                    true

            });

        }

        /* =====================================================

           NEXT MONTH

        ===================================================== */

        let nextDay = 1;

        while (

            days.length < 42

        ) {

            const date =

                new Date(

                    year,

                    month + 1,

                    nextDay

                );

            days.push({

                day:

                    nextDay,

                date,

                currentMonth:

                    false

            });

            nextDay++;

        }

        return days;

    };

    /* =========================================================

       SELECTED DATE KEY

    ========================================================= */

    const selectedDateKey =

        getDateKey(

            selectedDate

        );

    /* =========================================================

       SELECTED DATE TASKS

    ========================================================= */

    const selectedDateTasks =

        useMemo(() => {

            return tasks.filter(

                (task) =>

                    task.date ===

                    selectedDateKey

            );

        }, [

            tasks,

            selectedDateKey

        ]);

    /* =========================================================

       TODO TASKS

    ========================================================= */

    const todoTasks =

        selectedDateTasks.filter(

            (task) =>

                task.status !==

                "COMPLETED"

        );

    /* =========================================================

       COMPLETED TASKS

    ========================================================= */

    const completedTasks =

        selectedDateTasks.filter(

            (task) =>

                task.status ===

                "COMPLETED"

        );

    /* =========================================================

       ADD TASK

    ========================================================= */

    const addTask = async () => {

        const taskText =

            newTask.trim();

        if (!taskText) {

            return;

        }

        if (!newTaskPriority) {

            setError("Please select a priority.");

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

                                    selectedDateKey,

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

            setTasks(

                (previousTasks) => [

                    ...previousTasks,

                    data.task

                ]

            );

            setNewTask("");

            setNewTaskPriority("");

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

       ENTER KEY

    ========================================================= */

    const handleKeyDown = (e) => {

        if (

            e.key === "Enter"

        ) {

            e.preventDefault();

            addTask();

        }

    };

    /* =========================================================

       TOGGLE TASK

    ========================================================= */

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

                                    ["HIGH", "MEDIUM", "LOW"].includes(String(task.priority).toUpperCase())

                                        ? String(task.priority).toUpperCase()

                                        : "MEDIUM",

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

                            item._id === taskId

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

    EDIT TASK

    ========================================================= */

    const startEditingTask = (task) => {

        setEditingTaskId(task._id);

        setEditingTaskTitle(task.title);

        setEditingTaskPriority(

            String(task.priority || "MEDIUM").toUpperCase()

        );

        setOpenTaskMenu(null);

    };

    const cancelEditingTask = () => {

        setEditingTaskId(null);

        setEditingTaskTitle("");

        setEditingTaskPriority("");

    };

    const saveEditedTask = async (task) => {

        const title = editingTaskTitle.trim();

        if (!title) {

            setError("Task title cannot be empty.");

            return;

        }

        try {

            setError("");

            const token = getToken();

            if (!token) {

                setError("You are not logged in.");

                return;

            }

            const priority = ["HIGH", "MEDIUM", "LOW"].includes(

                String(editingTaskPriority).toUpperCase()

            )

                ? String(editingTaskPriority).toUpperCase()

                : "MEDIUM";

            const response = await fetch(

                `${API_URL}/${task._id}`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        title,

                        date: task.date,

                        priority,

                        status: task.status

                    })

                }

            );

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

            console.error(

                "Unable to edit task:",

                error

            );

            setError(error.message);

        }

    };

    /* =========================================================

       CALENDAR TASKS

    ========================================================= */

    const getTasksForDate = (date) => {

        const dateKey =

            getDateKey(date);

        return tasks.filter(

            (task) =>

                task.date ===

                dateKey

        );

    };

    /* =========================================================

       GO TO TODAY

    ========================================================= */

    const goToToday = () => {

        setCurrentDate(

            new Date(

                today.getFullYear(),

                today.getMonth(),

                1

            )

        );

        setSelectedDate(

            today

        );

    };

    /* =========================================================

       DRAG & DROP

    ========================================================= */

    const handleCalendarDragEnd =

        async (event) => {

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

            /* Only pending tasks */

            const pendingTasks =

                selectedDateTasks.filter(

                    (task) =>

                        task.status !==

                        "COMPLETED"

                );

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

            /* Reorder */

            const reorderedPending =

                arrayMove(

                    pendingTasks,

                    oldIndex,

                    newIndex

                );

            /* Reorder locally without changing priority types */

            const updatedSelectedDateTasks = [

                ...reorderedPending,

                ...completedTasks

            ];

            const otherDateTasks = tasks.filter(

                (task) => task.date !== selectedDateKey

            );

            setTasks([

                ...otherDateTasks,

                ...updatedSelectedDateTasks

            ]);

        };

    /* =========================================================

       RENDER

    ========================================================= */

    const profileInitial = name
        ? name.trim().charAt(0).toUpperCase()
        : "";

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

                                className="menu-btn"

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

                                className="menu-btn active"

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

                {/* =================================================

                    PAGE CONTENT

                ================================================= */}

                <div className="page-content">

                    {/* =================================================

                        CALENDAR

                    ================================================= */}

                    <div className="calendar-container">

                        {/* Header */}

                        <div className="calendar-header">

                            <div className="calendar-title">

                                <select

                                    value={

                                        currentDate.getMonth()

                                    }

                                    onChange={

                                        handleMonthChange

                                    }

                                    className="month-select"

                                >

                                    {monthNames.map(

                                        (

                                            month,

                                            index

                                        ) => (

                                            <option

                                                key={month}

                                                value={index}

                                            >

                                                {month}

                                            </option>

                                        )

                                    )}

                                </select>

                                <select

                                    value={

                                        currentDate.getFullYear()

                                    }

                                    onChange={

                                        handleYearChange

                                    }

                                    className="year-select"

                                >

                                    {years.map(

                                        (year) => (

                                            <option

                                                key={year}

                                                value={year}

                                            >

                                                {year}

                                            </option>

                                        )

                                    )}

                                </select>

                            </div>

                            <div className="calendar-navigation">

                                <button

                                    type="button"

                                    onClick={

                                        goToPreviousMonth

                                    }

                                    title="Previous month"

                                >

                                    ‹

                                </button>

                                <button

                                    type="button"

                                    onClick={

                                        goToNextMonth

                                    }

                                    title="Next month"

                                >

                                    ›

                                </button>

                            </div>

                        </div>

                        {/* Weekdays */}

                        <div className="calendar-weekdays">

                            {weekDays.map(

                                (day) => (

                                    <div key={day}>

                                        {day}

                                    </div>

                                )

                            )}

                        </div>

                        {/* Calendar Days */}

                        <div className="calendar-days">

                            {generateCalendarDays().map(

                                (

                                    item,

                                    index

                                ) => {

                                    const dateTasks =

                                        getTasksForDate(

                                            item.date

                                        );

                                    const hasTasks =

                                        dateTasks.length >

                                        0;

                                    const allCompleted =

                                        hasTasks &&

                                        dateTasks.every(

                                            (task) =>

                                                task.status ===

                                                "COMPLETED"

                                        );

                                    return (

                                        <button

                                            type="button"

                                            key={index}

                                            className={`

                                                calendar-day

                                                ${

                                                    !item.currentMonth

                                                        ? "other-month"

                                                        : ""

                                                }

                                                ${

                                                    isSameDate(

                                                        item.date,

                                                        selectedDate

                                                    )

                                                        ? "selected-day"

                                                        : ""

                                                }

                                                ${

                                                    hasTasks

                                                        ? "has-tasks"

                                                        : ""

                                                }

                                                ${

                                                    allCompleted

                                                        ? "all-completed"

                                                        : ""

                                                }

                                            `}

                                            onClick={() => {

                                                setSelectedDate(

                                                    item.date

                                                );

                                                if (

                                                    !item.currentMonth

                                                ) {

                                                    setCurrentDate(

                                                        new Date(

                                                            item.date.getFullYear(),

                                                            item.date.getMonth(),

                                                            1

                                                        )

                                                    );

                                                }

                                            }}

                                        >

                                            <span>

                                                {item.day}

                                            </span>

                                            {hasTasks && (

                                                <span

                                                    className="task-dot"

                                                />

                                            )}

                                        </button>

                                    );

                                }

                            )}

                        </div>

                        {/* Today */}

                        <button

                            type="button"

                            className="today-button"

                            onClick={

                                goToToday

                            }

                        >

                            Today

                        </button>

                    </div>

                    {/* =================================================

                        RIGHT SIDE

                    ================================================= */}

                    <div className="selected-date-panel">

                        {/* =================================================

                            PANEL HEADER

                        ================================================= */}

                        <div className="tasks-panel-header">

                            <div>

                                <p className="tasks-small-title">

                                    Tasks for

                                </p>

                                <h2>

                                    {selectedDate.toLocaleDateString(

                                        "en-US",

                                        {

                                            weekday:

                                                "long",

                                            month:

                                                "long",

                                            day:

                                                "numeric",

                                            year:

                                                "numeric"

                                        }

                                    )}

                                </h2>

                            </div>

                            <div className="task-count">

                                {

                                    selectedDateTasks.length

                                }

                            </div>

                        </div>

                        {/* =================================================

                            ERROR

                        ================================================= */}

                        {error && (

                            <p className="error-message">

                                {error}

                            </p>

                        )}

                        {/* =================================================

                            ADD TASK

                        ================================================= */}

                        <div className="calendar-add-task">

                            <input

                                type="text"

                                placeholder="Enter new task..."

                                value={newTask}

                                onChange={(e) =>

                                    setNewTask(

                                        e.target.value

                                    )

                                }

                                onKeyDown={

                                    handleKeyDown

                                }

                            />

                            <select

                                className="calendar-priority-select"

                                value={newTaskPriority}

                                onChange={(e) => setNewTaskPriority(e.target.value)}

                                aria-label="Task priority"

                            >

                                <option value="" disabled>Priority</option>

                                <option value="HIGH">High</option>

                                <option value="MEDIUM">Medium</option>

                                <option value="LOW">Low</option>

                            </select>

                            <button

                                type="button"

                                onClick={

                                    addTask

                                }

                                disabled={loading}

                            >

                                + Add Task

                            </button>

                        </div>

                        {/* =================================================

                            TASK SECTIONS

                        ================================================= */}

                        <div className="calendar-task-sections">

                            {/* =================================================

                                TODO TASKS

                            ================================================= */}

                            <div className="task-section">

                                <div className="task-section-header">

                                    <h3>

                                        Tasks Yet To Complete

                                    </h3>

                                    <span>

                                        {

                                            todoTasks.length

                                        }

                                    </span>

                                </div>

                                <div className="calendar-task-list">

                                    {loading ? (

                                        <div className="empty-task-message">

                                            Loading tasks...

                                        </div>

                                    ) : todoTasks.length ===

                                    0 ? (

                                        <div className="empty-task-message">

                                            No tasks to complete

                                        </div>

                                    ) : (

                                        <DndContext

                                            collisionDetection={

                                                closestCenter

                                            }

                                            onDragEnd={

                                                handleCalendarDragEnd

                                            }

                                        >

                                            <SortableContext

                                                items={

                                                    todoTasks.map(

                                                        (task) =>

                                                            task._id.toString()

                                                    )

                                                }

                                                strategy={

                                                    verticalListSortingStrategy

                                                }

                                            >

                                                {todoTasks.map(

                                                    (

                                                        task,

                                                        index

                                                    ) => (

                                                       <SortableCalendarTask

                                                            key={task._id}

                                                            task={task}

                                                            index={index}

                                                            toggleTask={toggleTask}

                                                            deleteTask={deleteTask}

                                                            openTaskMenu={openTaskMenu}

                                                            setOpenTaskMenu={setOpenTaskMenu}

                                                            editingTaskId={editingTaskId}

                                                            editingTaskTitle={editingTaskTitle}

                                                            setEditingTaskTitle={setEditingTaskTitle}

                                                            editingTaskPriority={editingTaskPriority}

                                                            setEditingTaskPriority={setEditingTaskPriority}

                                                            startEditingTask={startEditingTask}

                                                            saveEditedTask={saveEditedTask}

                                                            cancelEditingTask={cancelEditingTask}

                                                        />

                                                    )

                                                )}

                                            </SortableContext>

                                        </DndContext>

                                    )}

                                </div>

                            </div>

                            {/* =================================================

                                COMPLETED TASKS

                            ================================================= */}

                            <div className="task-section completed-section">

                                <div className="task-section-header">

                                    <h3>

                                         Completed Tasks

                                    </h3>

                                    <span>

                                        {

                                            completedTasks.length

                                        }

                                    </span>

                                </div>

                                <div className="calendar-task-list">

                                    {completedTasks.length ===

                                    0 ? (

                                        <div className="empty-task-message">

                                            No completed tasks

                                        </div>

                                    ) : (

                                        completedTasks.map(

                                            (

                                                task,

                                                index

                                            ) => (

                                                <div

                                                    key={

                                                        task._id

                                                    }

                                                    className="calendar-task completed-task"

                                                >

                                                    {/* Priority */}

                                                    <span className={`priority-badge priority-${String(task.priority || "MEDIUM").toLowerCase()}`}>

                                                        {String(task.priority || "MEDIUM").charAt(0).toUpperCase() + String(task.priority || "MEDIUM").slice(1).toLowerCase()}

                                                    </span>

                                                   {/* Task */}

                                                    {editingTaskId === task._id ? (

                                                        <div className="calendar-task-edit-container">

                                                            <input

                                                                type="text"

                                                                className="calendar-task-edit-input"

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

                                                                className="calendar-task-edit-priority"

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

                                                                className="calendar-edit-save-btn"

                                                                onClick={() => saveEditedTask(task)}

                                                            >

                                                                Save

                                                            </button>

                                                            <button

                                                                type="button"

                                                                className="calendar-edit-cancel-btn"

                                                                onClick={cancelEditingTask}

                                                            >

                                                                Cancel

                                                            </button>

                                                        </div>

                                                    ) : (

                                                        <span className="calendar-task-text">

                                                            {task.title}

                                                        </span>

                                                    )}

                                                    {/* Actions */}

                                                    <div className="calendar-task-actions">

                                                        <button

                                                            type="button"

                                                            className="task-action task-complete-btn active"

                                                            onClick={() =>

                                                                toggleTask(

                                                                    task._id

                                                                )

                                                            }

                                                            title="Mark as incomplete"

                                                        >

                                                            ✓

                                                        </button>

                                                        <div className="calendar-task-menu-wrapper">

                                                            <button

                                                                type="button"

                                                                className={`task-action calendar-task-menu-btn ${

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

                                                                <div className="calendar-task-menu">

                                                                    <button

                                                                        type="button"

                                                                        className="calendar-task-menu-item"

                                                                        onClick={(e) => {

                                                                            e.stopPropagation();

                                                                            startEditingTask(task);

                                                                        }}

                                                                    >

                                                                        <span>✏️</span>

                                                                        Edit

                                                                    </button>

                                                                    <button

                                                                        type="button"

                                                                        className="calendar-task-menu-item delete-option"

                                                                        onClick={(e) => {

                                                                            e.stopPropagation();

                                                                            setOpenTaskMenu(null);

                                                                            deleteTask(task._id);

                                                                        }}

                                                                    >

                                                                        <span>🗑️</span>

                                                                        Delete

                                                                    </button>

                                                                </div>

                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            )

                                        )

                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Calendar;
