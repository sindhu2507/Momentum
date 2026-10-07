import React, { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {

  ResponsiveContainer,

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  PieChart,

  Pie,

  Cell,

  Legend,

} from "recharts";

import "./Analytics.css";

const TASKS_API_URL = "http://localhost:5000/api/tasks";

const DAILY_TASKS_API_URL = "http://localhost:5000/api/daily-tasks";

const PROFILE_API = "http://localhost:5000/api/auth/me";

const PIE_COLORS = ["#171717", "#d1d5db"];

const RANGE_OPTIONS = [

  { value: "year", label: "Year" },

  { value: "6months", label: "6 Months" },

  { value: "3months", label: "3 Months" },

  { value: "month", label: "Month" },

  { value: "week", label: "Week" },

  { value: "day", label: "Day" },

];

/* =========================================================

   DATE HELPERS

========================================================= */

function getTodayString() {

  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(

    2,

    "0"

  )}-${String(now.getDate()).padStart(2, "0")}`;

}

function getCurrentMonth() {

  return getTodayString().slice(0, 7);

}

function getCurrentYear() {

  return String(new Date().getFullYear());

}

function formatDate(date) {

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(

    2,

    "0"

  )}-${String(date.getDate()).padStart(2, "0")}`;

}

function parseLocalDate(value) {

  if (!value) return new Date();

  const parts = String(value).slice(0, 10).split("-").map(Number);

  if (parts.length === 3) {

    return new Date(parts[0], parts[1] - 1, parts[2]);

  }

  return new Date();

}

function getMonthString(date) {

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(

    2,

    "0"

  )}`;

}

function startOfWeek(date) {

  const result = new Date(date);

  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;

}

function endOfWeek(date) {

  const result = startOfWeek(date);

  result.setDate(result.getDate() + 6);

  return result;

}

function startOfMonth(date) {

  return new Date(date.getFullYear(), date.getMonth(), 1);

}

function endOfMonth(date) {

  return new Date(date.getFullYear(), date.getMonth() + 1, 0);

}

function subtractMonths(date, months) {

  return new Date(date.getFullYear(), date.getMonth() - months, 1);

}

function getDateRange(range, selectedDate, selectedMonth, selectedYear) {

  const referenceDate = parseLocalDate(selectedDate);

  switch (range) {

    case "year": {

      const year = Number(selectedYear);

      return {

        start: new Date(year, 0, 1),

        end: new Date(year, 11, 31),

      };

    }

    case "6months": {

      const monthDate = parseLocalDate(`${selectedMonth}-01`);

      const start = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() - 5,

        1

      );

      const end = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() + 1,

        0

      );

      return { start, end };

    }

    case "3months": {

      const monthDate = parseLocalDate(`${selectedMonth}-01`);

      const start = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() - 2,

        1

      );

      const end = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() + 1,

        0

      );

      return { start, end };

    }

    case "month": {

      const monthDate = parseLocalDate(`${selectedMonth}-01`);

      return {

        start: startOfMonth(monthDate),

        end: endOfMonth(monthDate),

      };

    }

    case "week":

      return {

        start: startOfWeek(referenceDate),

        end: endOfWeek(referenceDate),

      };

    case "day":

    default:

      return {

        start: referenceDate,

        end: referenceDate,

      };

  }

}

function isDateInsideRange(dateString, rangeObject) {

  if (!dateString) return false;

  const date = parseLocalDate(dateString);

  const current = new Date(

    date.getFullYear(),

    date.getMonth(),

    date.getDate()

  );

  const start = new Date(

    rangeObject.start.getFullYear(),

    rangeObject.start.getMonth(),

    rangeObject.start.getDate()

  );

  const end = new Date(

    rangeObject.end.getFullYear(),

    rangeObject.end.getMonth(),

    rangeObject.end.getDate()

  );

  return current >= start && current <= end;

}

function formatRangeLabel(range, selectedDate, selectedMonth, selectedYear) {

  const referenceDate = parseLocalDate(selectedDate);

  switch (range) {

    case "year":

      return selectedYear;

    case "6months": {

      const monthDate = parseLocalDate(`${selectedMonth}-01`);

      const start = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() - 5,

        1

      );

      return `${start.toLocaleDateString("en-US", {

        month: "short",

      })} - ${monthDate.toLocaleDateString("en-US", {

        month: "short",

        year: "numeric",

      })}`;

    }

    case "3months": {

      const monthDate = parseLocalDate(`${selectedMonth}-01`);

      const start = new Date(

        monthDate.getFullYear(),

        monthDate.getMonth() - 2,

        1

      );

      return `${start.toLocaleDateString("en-US", {

        month: "short",

      })} - ${monthDate.toLocaleDateString("en-US", {

        month: "short",

        year: "numeric",

      })}`;

    }

    case "month":

      return referenceDate.toLocaleDateString("en-US", {

        month: "long",

        year: "numeric",

      });

    case "week": {

      const start = startOfWeek(referenceDate);

      const end = endOfWeek(referenceDate);

      return `${start.toLocaleDateString("en-US", {

        month: "short",

        day: "numeric",

      })} - ${end.toLocaleDateString("en-US", {

        month: "short",

        day: "numeric",

        year: "numeric",

      })}`;

    }

    case "day":

    default:

      return referenceDate.toLocaleDateString("en-US", {

        weekday: "short",

        month: "short",

        day: "numeric",

        year: "numeric",

      });

  }

}

/* =========================================================

   DATA HELPERS

========================================================= */

function extractArray(data, possibleKeys) {

  if (Array.isArray(data)) return data;

  for (const key of possibleKeys) {

    if (Array.isArray(data?.[key])) {

      return data[key];

    }

  }

  return [];

}

function normalizePriority(priority) {

  return String(priority || "")

    .trim()

    .toUpperCase();

}

function isCompletedTask(task) {

  const status = String(task?.status || "").toUpperCase();

  return (

    status === "COMPLETED" ||

    task?.completed === true ||

    task?.isCompleted === true

  );

}

function getTaskDate(task) {

  return (

    task?.date ||

    task?.dueDate ||

    task?.createdAt ||

    task?.startDate ||

    ""

  );

}

/* =========================================================

   PIE DATA

========================================================= */

function createPieData(tasks, priority = null) {

  const filteredTasks = priority

    ? tasks.filter(

        (task) => normalizePriority(task.priority) === priority

      )

    : tasks;

  const completed = filteredTasks.filter(isCompletedTask).length;

  const notCompleted = filteredTasks.length - completed;

  return [

    {

      name: "Completed",

      value: completed,

    },

    {

      name: "Not Completed",

      value: notCompleted,

    },

  ];

}

/* =========================================================

   PIE CHART COMPONENT

========================================================= */

function TaskPieCard({ title, data }) {

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (

    <div className="task-pie-card">

      <div className="task-pie-header">

        <h3>{title}</h3>

        <span className="task-pie-total">

          {total}

        </span>

      </div>

      <div className="task-pie-wrapper">

        {total === 0 ? (

          <div className="pie-empty">

            <div className="pie-empty-circle">0</div>

            <span>No tasks</span>

          </div>

        ) : (

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie

                data={data}

                cx="50%"

                cy="45%"

                innerRadius={48}

                outerRadius={70}

                paddingAngle={2}

                dataKey="value"

              >

                {data.map((entry, index) => (

                  <Cell

                    key={`cell-${index}`}

                    fill={PIE_COLORS[index % PIE_COLORS.length]}

                  />

                ))}

              </Pie>

              <Tooltip

                formatter={(value, name) => [value, name]}

                contentStyle={{

                  border: "1px solid #e5e7eb",

                  borderRadius: "9px",

                  boxShadow:

                    "0 8px 24px rgba(15, 23, 42, 0.08)",

                }}

              />

              <Legend

                verticalAlign="bottom"

                height={32}

                iconSize={8}

                wrapperStyle={{

                  fontSize: "11px",

                  color: "#737b87",

                }}

              />

            </PieChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>

  );

}

/* =========================================================

   ANALYTICS

========================================================= */

function Analytics() {

  const [name, setName] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) {

        setProfileLoading(false);

        return;

      }

      const response = await fetch(PROFILE_API, {

        method: "GET",

        headers: {

          Authorization: `Bearer ${token}`,

        },

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

  /* ---------------- TASK ANALYTICS ---------------- */

  const [tasks, setTasks] = useState([]);

  const [taskRange, setTaskRange] = useState("month");

  const [taskSelectedDate, setTaskSelectedDate] =

    useState(getTodayString());

  const [taskSelectedMonth, setTaskSelectedMonth] =

    useState(getCurrentMonth());

  const [taskSelectedYear, setTaskSelectedYear] =

    useState(getCurrentYear());

  /* ---------------- DAILY TASK ANALYTICS ---------------- */

  const [completions, setCompletions] = useState([]);

  const [dailyRange, setDailyRange] = useState("month");

  const [dailySelectedDate, setDailySelectedDate] =

    useState(getTodayString());

  const [dailySelectedMonth, setDailySelectedMonth] =

    useState(getCurrentMonth());

  const [dailySelectedYear, setDailySelectedYear] =

    useState(getCurrentYear());

  /* ---------------- STATES ---------------- */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================================

     LOAD TASKS + DAILY TASKS

  ========================================================= */

  useEffect(() => {

    const loadAnalytics = async () => {

      try {

        setLoading(true);

        setError("");

        const token = localStorage.getItem("token");

        if (!token) {

          throw new Error(

            "Please log in to view your analytics."

          );

        }

        const headers = {

          Authorization: `Bearer ${token}`,

        };

        const [tasksResponse, dailyResponse] =

          await Promise.all([

            fetch(TASKS_API_URL, {

              method: "GET",

              headers,

            }),

            fetch(

              `${DAILY_TASKS_API_URL}/with-completions`,

              {

                method: "GET",

                headers,

              }

            ),

          ]);

        const tasksData = await tasksResponse.json();

        const dailyData = await dailyResponse.json();

        if (!tasksResponse.ok) {

          throw new Error(

            tasksData.message ||

              "Unable to load tasks."

          );

        }

        if (!dailyResponse.ok) {

          throw new Error(

            dailyData.message ||

              "Unable to load daily task history."

          );

        }

        setTasks(

          extractArray(tasksData, [

            "tasks",

            "data",

            "results",

          ])

        );

        setCompletions(

          extractArray(dailyData, [

            "completions",

            "dailyTasks",

            "tasks",

            "data",

          ])

        );

      } catch (err) {

        console.error(

          "Unable to load analytics:",

          err

        );

        setError(

          err.message ||

            "Something went wrong while loading analytics."

        );

      } finally {

        setLoading(false);

      }

    };

    loadProfile();

    loadAnalytics();

  }, []);

  /* =========================================================

     TASK RANGE

  ========================================================= */

  const taskDateRange = useMemo(

    () =>

      getDateRange(

        taskRange,

        taskSelectedDate,

        taskSelectedMonth,

        taskSelectedYear

      ),

    [

      taskRange,

      taskSelectedDate,

      taskSelectedMonth,

      taskSelectedYear,

    ]

  );

  /* =========================================================

     FILTER TASKS

  ========================================================= */

  const filteredTasks = useMemo(() => {

    return tasks.filter((task) =>

      isDateInsideRange(

        getTaskDate(task),

        taskDateRange

      )

    );

  }, [tasks, taskDateRange]);

  /* =========================================================

     PIE DATA

  ========================================================= */

  const totalPieData = useMemo(

    () => createPieData(filteredTasks),

    [filteredTasks]

  );

  const highPieData = useMemo(

    () => createPieData(filteredTasks, "HIGH"),

    [filteredTasks]

  );

  const mediumPieData = useMemo(

    () => createPieData(filteredTasks, "MEDIUM"),

    [filteredTasks]

  );

  const lowPieData = useMemo(

    () => createPieData(filteredTasks, "LOW"),

    [filteredTasks]

  );

  const taskRangeLabel = useMemo(

    () =>

      formatRangeLabel(

        taskRange,

        taskSelectedDate,

        taskSelectedMonth,

        taskSelectedYear

      ),

    [

      taskRange,

      taskSelectedDate,

      taskSelectedMonth,

      taskSelectedYear,

    ]

  );

  /* =========================================================

     DAILY RANGE

  ========================================================= */

  const dailyDateRange = useMemo(

    () =>

      getDateRange(

        dailyRange,

        dailySelectedDate,

        dailySelectedMonth,

        dailySelectedYear

      ),

    [

      dailyRange,

      dailySelectedDate,

      dailySelectedMonth,

      dailySelectedYear,

    ]

  );

  /* =========================================================

     DAILY LINE GRAPH DATA

  ========================================================= */

  const dailyChartData = useMemo(() => {

    const start = dailyDateRange.start;

    const end = dailyDateRange.end;

    /* YEAR - MONTHLY GRAPH */

    if (dailyRange === "year") {

      const result = [];

      for (let month = 0; month < 12; month++) {

        const date = new Date(

          start.getFullYear(),

          month,

          1

        );

        const monthString = getMonthString(date);

        const completedCount = completions.filter(

          (completion) => {

            const completionDate = String(

              completion.date || ""

            ).slice(0, 10);

            return (

              completionDate.startsWith(

                `${monthString}-`

              ) &&

              completion.completed !== false

            );

          }

        ).length;

        result.push({

          label: date.toLocaleDateString("en-US", {

            month: "short",

          }),

          date: monthString,

          completed: completedCount,

        });

      }

      return result;

    }

    /* 6 MONTHS / 3 MONTHS / MONTH / WEEK / DAY */

    const result = [];

    let current = new Date(start);

    while (current <= end) {

      const dateString = formatDate(current);

      const completedCount = completions.filter(

        (completion) => {

          const completionDate = String(

            completion.date || ""

          ).slice(0, 10);

          return (

            completionDate === dateString &&

            completion.completed !== false

          );

        }

      ).length;

      result.push({

        label:

          dailyRange === "day"

            ? current.toLocaleDateString("en-US", {

                day: "numeric",

                month: "short",

              })

            : current.getDate(),

        date: dateString,

        completed: completedCount,

      });

      current.setDate(current.getDate() + 1);

    }

    return result;

  }, [

    completions,

    dailyDateRange,

    dailyRange,

  ]);

  const dailyRangeLabel = useMemo(

    () =>

      formatRangeLabel(

        dailyRange,

        dailySelectedDate,

        dailySelectedMonth,

        dailySelectedYear

      ),

    [

      dailyRange,

      dailySelectedDate,

      dailySelectedMonth,

      dailySelectedYear,

    ]

  );

  const totalDailyCompleted = useMemo(

    () =>

      dailyChartData.reduce(

        (total, item) => total + item.completed,

        0

      ),

    [dailyChartData]

  );

  /* =========================================================

     FORMAT DAILY TOOLTIP

  ========================================================= */

  const formatTooltipDate = (date) => {

    if (!date) return "";

    const parsed = parseLocalDate(date);

    return parsed.toLocaleDateString("en-US", {

      weekday: "long",

      month: "short",

      day: "numeric",

      year: "numeric",

    });

  };

  /* =========================================================

     RANGE SELECTOR

  ========================================================= */

  const renderRangeSelector = (

    range,

    setRange,

    selectedDate,

    setSelectedDate,

    selectedMonth,

    setSelectedMonth,

    selectedYear,

    setSelectedYear

  ) => {

    return (

      <div className="analytics-controls">

        <div className="range-buttons">

          {RANGE_OPTIONS.map((option) => (

            <button

              key={option.value}

              type="button"

              className={`range-btn ${

                range === option.value

                  ? "active"

                  : ""

              }`}

              onClick={() =>

                setRange(option.value)

              }

            >

              {option.label}

            </button>

          ))}

        </div>

        <div className="selection-control">

          <span className="selection-label">

            Select

          </span>

          {range === "year" && (

            <input

              type="number"

              min="2000"

              max="2100"

              value={selectedYear}

              onChange={(event) =>

                setSelectedYear(

                  event.target.value

                )

              }

              className="analytics-input year-input"

            />

          )}

          {(range === "6months" ||

            range === "3months" ||

            range === "month") && (

            <input

              type="month"

              value={selectedMonth}

              onChange={(event) =>

                setSelectedMonth(

                  event.target.value

                )

              }

              className="analytics-input"

            />

          )}

          {(range === "week" ||

            range === "day") && (

            <input

              type="date"

              value={selectedDate}

              onChange={(event) =>

                setSelectedDate(

                  event.target.value

                )

              }

              className="analytics-input"

            />

          )}

        </div>

      </div>

    );

  };

  /* =========================================================

     RETURN

  ========================================================= */

  const profileInitial = name

    ? name.trim().charAt(0).toUpperCase()

    : "";

  return (

    <div className="main-layout">

      <div className="home">

        {/* ================= NAVBAR ================= */}

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

                className="menu-btn"

              >

                Calendar

              </Link>

              <Link

                to="/analytics"

                className="menu-btn active"

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

                {profileLoading ? "" : profileInitial || "U"}

              </div>

            </Link>

          </div>

        </nav>

        {/* ================= ANALYTICS CONTENT ================= */}

        <main className="page-content analytics-content">

          {/* =================================================

              UPPER SECTION - TASKS

          ================================================= */}

          <section className="tasks-analytics-section">

            <div className="section-top">

              <div>

                <h1 className="analytics-section-title">

                  Tasks

                </h1>

                <p className="analytics-section-subtitle">

                  Track your task completion by priority.

                </p>

              </div>

              <span className="selected-range-label">

                {taskRangeLabel}

              </span>

            </div>

            {renderRangeSelector(

              taskRange,

              setTaskRange,

              taskSelectedDate,

              setTaskSelectedDate,

              taskSelectedMonth,

              setTaskSelectedMonth,

              taskSelectedYear,

              setTaskSelectedYear

            )}

            {error ? (

              <div className="analytics-error-box">

                {error}

              </div>

            ) : (

              <div className="task-pie-charts">

                <TaskPieCard

                  title="Total Tasks"

                  data={totalPieData}

                />

                <TaskPieCard

                  title="High Priority"

                  data={highPieData}

                />

                <TaskPieCard

                  title="Medium Priority"

                  data={mediumPieData}

                />

                <TaskPieCard

                  title="Low Priority"

                  data={lowPieData}

                />

              </div>

            )}

          </section>

          {/* =================================================

              LOWER SECTION - DAILY TASKS

          ================================================= */}

          <section className="daily-analytics-section">

            <div className="section-top">

              <div>

                <h2 className="analytics-section-title">

                  Daily Tasks

                </h2>

                <p className="analytics-section-subtitle">

                  Track your daily task completion trend.

                </p>

              </div>

              <span className="selected-range-label">

                {dailyRangeLabel}

              </span>

            </div>

            {renderRangeSelector(

              dailyRange,

              setDailyRange,

              dailySelectedDate,

              setDailySelectedDate,

              dailySelectedMonth,

              setDailySelectedMonth,

              dailySelectedYear,

              setDailySelectedYear

            )}

            <div className="daily-chart-card">

              <div className="daily-chart-header">

                <div>

                  <h3>

                    Completion Trend

                  </h3>

                  <p>

                    Completed daily tasks

                  </p>

                </div>

                <div className="daily-completed-count">

                  <span>

                    Completed

                  </span>

                  <strong>

                    {loading

                      ? "-"

                      : totalDailyCompleted}

                  </strong>

                </div>

              </div>

              {loading ? (

                <div className="analytics-message">

                  Loading your analytics...

                </div>

              ) : (

                <div className="daily-line-chart">

                  <ResponsiveContainer

                    width="100%"

                    height="100%"

                  >

                    <LineChart

                      data={dailyChartData}

                      margin={{

                        top: 20,

                        right: 24,

                        left: 5,

                        bottom: 10,

                      }}

                    >

                      <CartesianGrid

                        stroke="#e9edf3"

                        strokeDasharray="4 4"

                      />

                      <XAxis

                        dataKey="label"

                        tickLine={false}

                        axisLine={{

                          stroke: "#dfe4ec",

                        }}

                        tick={{

                          fill: "#7b8492",

                          fontSize: 12,

                        }}

                        tickMargin={10}

                        interval={

                          dailyChartData.length > 20

                            ? 2

                            : 0

                        }

                      />

                      <YAxis

                        allowDecimals={false}

                        domain={[

                          0,

                          (dataMax) =>

                            Math.max(

                              1,

                              dataMax

                            ),

                        ]}

                        tickLine={false}

                        axisLine={false}

                        tick={{

                          fill: "#7b8492",

                          fontSize: 12,

                        }}

                        width={42}

                      />

                      <Tooltip

                        labelFormatter={(

                          label,

                          payload

                        ) =>

                          payload?.[0]?.payload

                            ?.date

                            ? formatTooltipDate(

                                payload[0]

                                  .payload.date

                              )

                            : label

                        }

                        formatter={(value) => [

                          value,

                          "Tasks completed",

                        ]}

                        contentStyle={{

                          border:

                            "1px solid #e5e7eb",

                          borderRadius: "10px",

                          boxShadow:

                            "0 8px 24px rgba(15, 23, 42, 0.08)",

                        }}

                      />

                      <Line

                        type="monotone"

                        dataKey="completed"

                        name="Tasks completed"

                        stroke="#171717"

                        strokeWidth={3}

                        dot={{

                          r: 3,

                          fill: "#171717",

                          strokeWidth: 0,

                        }}

                        activeDot={{

                          r: 6,

                          stroke: "#ffffff",

                          strokeWidth: 2,

                        }}

                        connectNulls

                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              )}

              {!loading &&

                !error &&

                totalDailyCompleted === 0 && (

                  <p className="no-completions-note">

                    No completed daily tasks

                    recorded for this period yet.

                  </p>

                )}

            </div>

          </section>

        </main>

      </div>

    </div>

  );

}

export default Analytics;
