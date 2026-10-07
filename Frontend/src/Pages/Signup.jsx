import React, { useState } from "react";
import "./Signup.css";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "https://momentum-q6m6.onrender.com/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            alert("Account created successfully! Please login.");
            navigate("/Login");
        } catch (error) {
            console.error("Signup error:", error);
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">

            {/* LEFT SIDE */}

            <div className="signup-left">

                <h1 className="signup-brand">
                    Momentum
                </h1>

                <p className="signup-tagline">
                    Build consistency.
                    <br />
                    Make progress every day.
                </p>

            </div>

            {/* RIGHT SIDE */}

            <div className="signup-right">

                <div className="signup-box">

                    <h2 className="title">
                        Create Account
                    </h2>

                    <p className="signup-subtitle">
                        Start your journey with Momentum
                    </p>

                    <form onSubmit={handleSubmit}>

                        {/* NAME */}

                        <input
                            type="text"
                            placeholder="Enter your full name"
                            className="input-field"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />

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
                            placeholder="Create password"
                            className="input-field"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                        {/* CONFIRM PASSWORD */}

                        <input
                            type="password"
                            placeholder="Confirm password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            required
                        />

                        {/* ERROR */}

                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}

                        {/* SIGNUP BUTTON */}

                        <button
                            type="submit"
                            className="signup-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Sign Up"}
                        </button>

                        {/* LOGIN LINK */}

                        <p className="bottom-text">
                            Already have an account?{" "}

                            <Link
                                to="/Login"
                                className="login-link"
                            >
                                Login
                            </Link>
                        </p>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default Signup;