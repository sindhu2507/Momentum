import React, { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://momentum-q6m6.onrender.com/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Store JWT token
            localStorage.setItem("token", data.token);

            // Store logged-in user
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // Go to Home
            navigate("/home");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            {/* LEFT SIDE */}

            <div className="login-left">

                <h1 className="login-brand">
                    Momentum
                </h1>

                <p className="login-tagline">
                    Build consistency.
                    <br />
                    Make progress every day.
                </p>

            </div>

            {/* RIGHT SIDE */}

            <div className="login-right">

                <div className="login-box">

                    <h2 className="title">
                        Login
                    </h2>

                    <p className="login-subtitle">
                        Welcome back to Momentum
                    </p>

                    <form onSubmit={handleSubmit}>

                        {/* EMAIL */}

                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="input-field"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        {/* PASSWORD */}

                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="input-field"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                        {/* ERROR */}

                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}

                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </button>

                        {/* SIGNUP LINK */}

                        <p className="bottom-text">
                            Don't have an account?{" "}

                            <Link
                                to="/"
                                className="signup-link"
                            >
                                Sign Up
                            </Link>
                        </p>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default Login;