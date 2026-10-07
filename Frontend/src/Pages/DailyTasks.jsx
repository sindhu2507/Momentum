import React, {
    useRef,
    useState,
    useEffect
} from "react";

import { Link } from "react-router-dom";

import "./DailyTasks.css";


function DailyTasks() {

    // ======================================================
    // BASIC STATES
    // ======================================================

    const [name, setName] = useState("");

    const [profileLoading, setProfileLoading] =
        useState(true);

    const [taskText, setTaskText] =
        useState("");

    const [startTime, setStartTime] =
        useState("");

    const [endTime, setEndTime] =
        useState("");

    const [tasks, setTasks] =
        useState([]);


    // ======================================================
    // MONTH / YEAR
    // ======================================================

    const today = new Date();

    const currentMonth =
        today.getMonth() + 1;

    const currentYear =
        today.getFullYear();


    const [selectedMonth, setSelectedMonth] =
        useState(currentMonth);

    const [selectedYear, setSelectedYear] =
        useState(currentYear);


    // ======================================================
    // EDIT TASK
    // ======================================================

    const [editingTask, setEditingTask] =
        useState(null);

    const [editTaskText, setEditTaskText] =
        useState("");

    const [editStartTime, setEditStartTime] =
        useState("");

    const [editEndTime, setEditEndTime] =
        useState("");


    // ======================================================
    // THREE DOT MENU
    // ======================================================

    const [openMenuId, setOpenMenuId] =
        useState(null);

    const [menuPosition, setMenuPosition] =
        useState({
            top: 0,
            left: 0
        });


    // ======================================================
    // REFS
    // ======================================================

    const startTimeRef =
        useRef(null);

    const endTimeRef =
        useRef(null);

    const taskInputRef =
        useRef(null);


    // ======================================================
    // MONTH NAMES
    // ======================================================

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


    // ======================================================
    // YEARS
    // ======================================================

    const years = [];

    for (
        let year = currentYear - 5;
        year <= currentYear + 5;
        year++
    ) {
        years.push(year);
    }


    // ======================================================
    // DAYS
    // ======================================================

    const daysInMonth =
        new Date(
            selectedYear,
            selectedMonth,
            0
        ).getDate();


    const dates = Array.from(
        {
            length: daysInMonth
        },
        (_, index) =>
            index + 1
    );


    const dayNames = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    // ======================================================
    // API
    // ======================================================

    const API_URL =
        "http://localhost:5000/api/daily-tasks";

    const PROFILE_API =
        "http://localhost:5000/api/auth/me";


    // ======================================================
    // GET TOKEN
    // ======================================================

    const getToken = () => {
        return localStorage.getItem(
            "token"
        );
    };


    // ======================================================
    // CHECK PAST DATE
    // ======================================================

    const isPastDate = (date) => {

        const currentDate =
            new Date();

        const checkDate =
            new Date(
                selectedYear,
                selectedMonth - 1,
                date
            );


        currentDate.setHours(
            0,
            0,
            0,
            0
        );

        checkDate.setHours(
            0,
            0,
            0,
            0
        );


        return (
            checkDate <
            currentDate
        );
    };


    // ======================================================
    // LOAD PROFILE
    // ======================================================

    const loadProfile = async () => {

        try {

            const token =
                getToken();


            if (!token) {

                setProfileLoading(
                    false
                );

                return;
            }


            const response =
                await fetch(
                    PROFILE_API,
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
                    "Unable to load profile"
                );
            }


            setName(
                data.user?.name ||
                ""
            );

        } catch (error) {

            console.error(
                "Unable to load profile:",
                error
            );

        } finally {

            setProfileLoading(
                false
            );
        }
    };


    // ======================================================
    // LOAD TASKS
    // ======================================================

    const loadTasks = async () => {

        try {

            const token =
                getToken();


            if (!token) {

                console.error(
                    "Authentication token not found"
                );

                return;
            }


            const response =
                await fetch(
                    `${API_URL}/with-completions?month=${selectedMonth}&year=${selectedYear}`,
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

                console.error(
                    data.message ||
                    "Failed to load daily tasks"
                );

                return;
            }


            const formattedTasks =
                (
                    data.dailyTasks ||
                    []
                ).map(
                    (task) => {

                        const completedDates =
                            (
                                data.completions ||
                                []
                            )
                                .filter(
                                    (completion) =>
                                        completion.dailyTask ===
                                            task._id ||
                                        completion.dailyTask?._id ===
                                            task._id
                                )
                                .map(
                                    (completion) => {

                                        const [
                                            y,
                                            m,
                                            d
                                        ] =
                                            completion
                                                .date
                                                .split(
                                                    "-"
                                                )
                                                .map(
                                                    Number
                                                );


                                        if (
                                            y ===
                                                selectedYear &&
                                            m ===
                                                selectedMonth
                                        ) {

                                            return d;
                                        }


                                        return null;
                                    }
                                )
                                .filter(
                                    (date) =>
                                        date !==
                                        null
                                );


                        return {

                            id:
                                task._id,

                            text:
                                task.title,

                            startTime:
                                task.startTime ||
                                "",

                            endTime:
                                task.endTime ||
                                "",

                            completedDates
                        };
                    }
                );


            // Timed tasks first
            formattedTasks.sort(
                (a, b) => {

                    if (
                        a.startTime === ""
                    ) {
                        return 1;
                    }

                    if (
                        b.startTime === ""
                    ) {
                        return -1;
                    }

                    return a.startTime.localeCompare(
                        b.startTime
                    );
                }
            );


            setTasks(
                formattedTasks
            );

        } catch (error) {

            console.error(
                "Failed to load daily tasks:",
                error
            );
        }
    };


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {

        loadProfile();

    }, []);


    // ======================================================
    // LOAD WHEN MONTH / YEAR CHANGES
    // ======================================================

    useEffect(() => {

        loadTasks();

        setOpenMenuId(
            null
        );

    }, [
        selectedMonth,
        selectedYear
    ]);


    // ======================================================
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // ======================================================

    useEffect(() => {

        const handleClickOutside = () => {

            setOpenMenuId(
                null
            );
        };


        if (
            openMenuId !== null
        ) {

            document.addEventListener(
                "click",
                handleClickOutside
            );
        }


        return () => {

            document.removeEventListener(
                "click",
                handleClickOutside
            );

        };

    }, [
        openMenuId
    ]);


    // ======================================================
    // INPUT NAVIGATION
    // ======================================================

    const handleInputKeyDown = (
        event,
        nextRef
    ) => {

        if (
            event.key === "Enter" ||
            event.key === "ArrowRight"
        ) {

            event.preventDefault();


            if (
                nextRef?.current
            ) {

                nextRef.current.focus();
            }
        }
    };


    // ======================================================
    // ADD TASK
    // ======================================================

    const addTask = async () => {

        if (
            !taskText.trim()
        ) {
            return;
        }


        try {

            const token =
                getToken();


            if (!token) {

                alert(
                    "Please login again."
                );

                return;
            }


            const response =
                await fetch(
                    `${API_URL}?month=${selectedMonth}&year=${selectedYear}`,
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
                                    taskText.trim(),

                                startTime,

                                endTime
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to add daily task"
                );

                return;
            }


            await loadTasks();


            setTaskText("");

            setStartTime("");

            setEndTime("");


        } catch (error) {

            console.error(
                "Failed to add daily task:",
                error
            );

            alert(
                "Unable to connect to the server."
            );
        }
    };


    // ======================================================
    // OPEN THREE DOT MENU
    // ======================================================

    const toggleTaskMenu = (
        event,
        taskId
    ) => {

        event.stopPropagation();


        // Close if already open

        if (
            openMenuId === taskId
        ) {

            setOpenMenuId(
                null
            );

            return;
        }


        const button =
            event.currentTarget;


        const rect =
            button.getBoundingClientRect();


        const menuWidth =
            130;

        const menuHeight =
            84;


        let left =
            rect.right -
            menuWidth;


        let top =
            rect.bottom +
            5;


        // Keep menu inside
        // right side of screen

        if (
            left +
                menuWidth >
            window.innerWidth - 10
        ) {

            left =
                window.innerWidth -
                menuWidth -
                10;
        }


        // If menu doesn't fit below,
        // open above

        if (
            top +
                menuHeight >
            window.innerHeight - 10
        ) {

            top =
                rect.top -
                menuHeight -
                5;
        }


        // Keep menu inside
        // left side

        if (
            left < 10
        ) {

            left = 10;
        }


        // Keep menu inside
        // top side

        if (
            top < 10
        ) {

            top = 10;
        }


        setMenuPosition({
            top,
            left
        });


        setOpenMenuId(
            taskId
        );
    };


    // ======================================================
    // OPEN EDIT
    // ======================================================

    const openEditTask = (
        task
    ) => {

        setEditingTask(
            task
        );


        setEditTaskText(
            task.text
        );


        setEditStartTime(
            task.startTime ||
            ""
        );


        setEditEndTime(
            task.endTime ||
            ""
        );


        setOpenMenuId(
            null
        );
    };


    // ======================================================
    // CANCEL EDIT
    // ======================================================

    const cancelEdit = () => {

        setEditingTask(
            null
        );

        setEditTaskText("");

        setEditStartTime("");

        setEditEndTime("");
    };


    // ======================================================
    // SAVE EDIT
    // ======================================================

    const saveEditTask =
        async () => {

            if (
                !editingTask ||
                !editTaskText.trim()
            ) {

                return;
            }


            try {

                const token =
                    getToken();


                if (!token) {

                    alert(
                        "Please login again."
                    );

                    return;
                }


                const response =
                    await fetch(
                        `${API_URL}/${editingTask.id}?month=${selectedMonth}&year=${selectedYear}`,
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
                                        editTaskText.trim(),

                                    startTime:
                                        editStartTime,

                                    endTime:
                                        editEndTime
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to update task"
                    );

                    return;
                }


                await loadTasks();

                cancelEdit();


            } catch (error) {

                console.error(
                    "Failed to update task:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        };


    // ======================================================
    // DELETE TASK
    // ======================================================

    const deleteTask =
        async (task) => {

            setOpenMenuId(
                null
            );


            const confirmed =
                window.confirm(
                    `Delete "${task.text}" for ${monthNames[selectedMonth - 1]} ${selectedYear}?`
                );


            if (!confirmed) {
                return;
            }


            try {

                const token =
                    getToken();


                if (!token) {

                    alert(
                        "Please login again."
                    );

                    return;
                }


                const response =
                    await fetch(
                        `${API_URL}/${task.id}?month=${selectedMonth}&year=${selectedYear}`,
                        {
                            method:
                                "DELETE",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to delete task"
                    );

                    return;
                }


                await loadTasks();


            } catch (error) {

                console.error(
                    "Failed to delete task:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        };


    // ======================================================
    // TOGGLE COMPLETION
    // ======================================================

    const toggleDate = async (
        taskId,
        date
    ) => {

        try {

            const token =
                getToken();


            if (!token) {

                alert(
                    "Please login again."
                );

                return;
            }


            const formattedMonth =
                String(
                    selectedMonth
                ).padStart(
                    2,
                    "0"
                );


            const formattedDate =
                String(
                    date
                ).padStart(
                    2,
                    "0"
                );


            const fullDate =
                `${selectedYear}-${formattedMonth}-${formattedDate}`;


            const response =
                await fetch(
                    `${API_URL}/${taskId}/completion/${fullDate}`,
                    {
                        method:
                            "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to update completion"
                );

                return;
            }


            setTasks(
                (currentTasks) =>
                    currentTasks.map(
                        (task) => {

                            if (
                                task.id !==
                                taskId
                            ) {

                                return task;
                            }


                            const alreadyDone =
                                task.completedDates.includes(
                                    date
                                );


                            return {

                                ...task,

                                completedDates:
                                    alreadyDone

                                        ? task.completedDates.filter(
                                              (d) =>
                                                  d !==
                                                  date
                                          )

                                        : [
                                              ...task.completedDates,
                                              date
                                          ]
                            };
                        }
                    )
            );


        } catch (error) {

            console.error(
                "Failed to toggle completion:",
                error
            );

            alert(
                "Unable to connect to the server."
            );
        }
    };


    // ======================================================
    // FILTER TASKS
    // ======================================================

    const timedTasks =
        tasks.filter(
            (task) =>
                task.startTime !== ""
        );


    const untimedTasks =
        tasks.filter(
            (task) =>
                task.startTime === ""
        );


    // ======================================================
    // RENDER TASK ROW
    // ======================================================

    const renderTaskRow =
        (task) => (

            <tr
                key={task.id}
            >

                {/* START TIME */}

                <td
                    className="time-cell"
                >
                    {task.startTime ||
                        "--"}
                </td>


                {/* END TIME */}

                <td
                    className="time-cell"
                >
                    {task.endTime ||
                        "--"}
                </td>


                {/* TASK */}

                <td
                    className="task-cell"
                >

                    <div
                        className="task-cell-content"
                    >

                        <span>
                            {task.text}
                        </span>


                        <div
                            className="task-menu-wrapper"
                        >

                            <button
                                type="button"

                                className="task-menu-btn"

                                onClick={(event) =>
                                    toggleTaskMenu(
                                        event,
                                        task.id
                                    )
                                }
                            >
                                ⋮
                            </button>

                        </div>

                    </div>

                </td>


                {/* DATES */}

                {dates.map(
                    (date) => {

                        const checked =
                            task.completedDates.includes(
                                date
                            );


                        return (

                            <td
                                key={date}
                            >

                                <div
                                    className={
                                        checked
                                            ? "date-box checked"
                                            : isPastDate(
                                                  date
                                              )
                                                ? "date-box missed"
                                                : "date-box"
                                    }

                                    onClick={() =>
                                        toggleDate(
                                            task.id,
                                            date
                                        )
                                    }
                                >

                                    {checked
                                        ? "✓"
                                        : ""}

                                </div>

                            </td>
                        );
                    }
                )}

            </tr>
        );


    // ======================================================
    // PROFILE INITIAL
    // ======================================================

    const profileInitial =
        name
            ? name
                  .trim()
                  .charAt(0)
                  .toUpperCase()
            : "";


    // ======================================================
    // CURRENT OPEN MENU TASK
    // ======================================================

    const selectedMenuTask =
        tasks.find(
            (task) =>
                task.id ===
                openMenuId
        );


    // ======================================================
    // JSX
    // ======================================================

    return (

        <div
            className="main-layout"
        >

            <div
                className="home"
            >

                {/* ==================================================
                    NAVBAR
                ================================================== */}

                <nav
                    className="navbar"
                >

                    <div
                        className="nav-left"
                    >

                        <h2
                            className="home-logo"
                        >
                            Momentum
                        </h2>


                        <div
                            className="nav-menu"
                        >

                            <Link
                                to="/home"
                                className="menu-btn"
                            >
                                Home
                            </Link>


                            <Link
                                to="/daily"
                                className="menu-btn active"
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


                    <div
                        className="nav-right"
                    >

                        <Link
                            to="/profile"
                            className="profile-link"
                        >

                            <div
                                className="navbar-profile"
                            >

                                {
                                    profileLoading
                                        ? ""
                                        : profileInitial
                                }

                            </div>

                        </Link>

                    </div>

                </nav>


                {/* ==================================================
                    MONTH + YEAR + ADD TASK
                    ALL IN ONE ROW
                ================================================== */}

                <section
                    className="daily-controls-row"
                >

                    {/* MONTH */}

                    <div
                        className="month-selector-group"
                    >

                        <label>
                            Month
                        </label>


                        <select
                            value={
                                selectedMonth
                            }

                            onChange={(event) =>
                                setSelectedMonth(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        >

                            {monthNames.map(
                                (
                                    monthName,
                                    index
                                ) => (

                                    <option
                                        key={
                                            index + 1
                                        }

                                        value={
                                            index + 1
                                        }
                                    >
                                        {monthName}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* YEAR */}

                    <div
                        className="month-selector-group"
                    >

                        <label>
                            Year
                        </label>


                        <select
                            value={
                                selectedYear
                            }

                            onChange={(event) =>
                                setSelectedYear(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
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


                    {/* START TIME */}

                    <input
                        ref={
                            startTimeRef
                        }

                        type="time"

                        value={
                            startTime
                        }

                        onChange={(event) =>
                            setStartTime(
                                event.target.value
                            )
                        }

                        onKeyDown={(event) =>
                            handleInputKeyDown(
                                event,
                                endTimeRef
                            )
                        }

                        className="time-input"
                    />


                    {/* END TIME */}

                    <input
                        ref={
                            endTimeRef
                        }

                        type="time"

                        value={
                            endTime
                        }

                        onChange={(event) =>
                            setEndTime(
                                event.target.value
                            )
                        }

                        onKeyDown={(event) =>
                            handleInputKeyDown(
                                event,
                                taskInputRef
                            )
                        }

                        className="time-input"
                    />


                    {/* TASK */}

                    <input
                        ref={
                            taskInputRef
                        }

                        type="text"

                        placeholder="Enter task..."

                        value={
                            taskText
                        }

                        onChange={(event) =>
                            setTaskText(
                                event.target.value
                            )
                        }

                        onKeyDown={(event) => {

                            if (
                                event.key ===
                                "Enter"
                            ) {

                                event.preventDefault();

                                addTask();
                            }

                        }}

                        className="daily-task-input"
                    />


                    {/* ADD */}

                    <button
                        type="button"

                        className="daily-add-btn"

                        onClick={
                            addTask
                        }
                    >
                        + Add
                    </button>

                </section>


                {/* ==================================================
                    EDIT TASK
                ================================================== */}

                {editingTask && (

                    <section
                        className="daily-edit-box"
                    >

                        <div
                            className="edit-task-title"
                        >
                            Edit Task
                        </div>


                        <input
                            type="time"

                            value={
                                editStartTime
                            }

                            onChange={(event) =>
                                setEditStartTime(
                                    event.target.value
                                )
                            }

                            className="time-input"
                        />


                        <input
                            type="time"

                            value={
                                editEndTime
                            }

                            onChange={(event) =>
                                setEditEndTime(
                                    event.target.value
                                )
                            }

                            className="time-input"
                        />


                        <input
                            type="text"

                            value={
                                editTaskText
                            }

                            onChange={(event) =>
                                setEditTaskText(
                                    event.target.value
                                )
                            }

                            className="daily-task-input"
                        />


                        <button
                            type="button"

                            className="daily-save-btn"

                            onClick={
                                saveEditTask
                            }
                        >
                            Save
                        </button>


                        <button
                            type="button"

                            className="daily-cancel-btn"

                            onClick={
                                cancelEdit
                            }
                        >
                            Cancel
                        </button>

                    </section>

                )}


                {/* ==================================================
                    TABLE
                ================================================== */}

                <section
                    className="task-table-card"
                >

                    <div
                        className="table-wrapper"
                    >

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Start Time
                                    </th>


                                    <th>
                                        End Time
                                    </th>


                                    <th>
                                        Task
                                    </th>


                                    {dates.map(
                                        (date) => {

                                            const dateObject =
                                                new Date(
                                                    selectedYear,
                                                    selectedMonth - 1,
                                                    date
                                                );


                                            const dayName =
                                                dayNames[
                                                    dateObject.getDay()
                                                ];


                                            return (

                                                <th
                                                    key={
                                                        date
                                                    }
                                                >

                                                    <div
                                                        className="date-number"
                                                    >
                                                        {date}
                                                    </div>


                                                    <div
                                                        className="day-name"
                                                    >
                                                        {dayName}
                                                    </div>

                                                </th>

                                            );
                                        }
                                    )}

                                </tr>

                            </thead>


                            <tbody>

                                {timedTasks.map(
                                    renderTaskRow
                                )}


                                {untimedTasks.map(
                                    renderTaskRow
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* ==================================================
                    FLOATING THREE-DOT MENU

                    IMPORTANT:
                    This is OUTSIDE the table.
                ================================================== */}

                {openMenuId &&
                    selectedMenuTask && (

                        <div
                            className="floating-task-menu"

                            style={{
                                top:
                                    `${menuPosition.top}px`,

                                left:
                                    `${menuPosition.left}px`
                            }}

                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <button
                                type="button"

                                onClick={() =>
                                    openEditTask(
                                        selectedMenuTask
                                    )
                                }
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"

                                onClick={() =>
                                    deleteTask(
                                        selectedMenuTask
                                    )
                                }
                            >
                                🗑️ Delete
                            </button>

                        </div>

                    )}

            </div>

        </div>
    );
}


export default DailyTasks;