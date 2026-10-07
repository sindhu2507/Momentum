import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Timetable.css";

function TimeTable() {
    const [name, setName] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);

    const PROFILE_API = "https://momentum-q6m6.onrender.com/api/auth/me";

    const getToken = () => {
        return localStorage.getItem("token");
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

    useEffect(() => {
        loadProfile();
    }, []);

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

                            <Link to="/home" className="menu-btn">
                                Home
                            </Link>

                            <Link to="/daily" className="menu-btn">
                                Daily Tasks
                            </Link>

                            <Link
                                to="/timetable"
                                className="menu-btn active"
                            >
                                Timetable Planner
                            </Link>

                            <Link to="/calendar" className="menu-btn">
                                Calendar
                            </Link>

                            <Link to="/analytics" className="menu-btn">
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
                                {profileLoading
                                    ? ""
                                    : profileInitial}
                            </div>
                        </Link>
                    </div>

                </nav>

                {/* ================= PAGE CONTENT ================= */}

                <div className="page-content">

                    <div className="timetable-message">
                        This page is currently under development.
                        We’re working on something great — your
                        Timetable Planner will be available soon!
                    </div>

                </div>

            </div>
        </div>
    );
}

export default TimeTable;