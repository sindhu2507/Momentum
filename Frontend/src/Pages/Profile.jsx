import React, {

    useEffect,

    useState

} from "react";



import { Link } from "react-router-dom";



import "./Profile.css";





/* =========================================================

   API

========================================================= */



const PROFILE_API =

    "https://momentum-q6m6.onrender.com/api/auth/me";



const UPDATE_PROFILE_API =

    "https://momentum-q6m6.onrender.com/api/auth/update-profile";



const PASSWORD_API =

    "https://momentum-q6m6.onrender.com/api/auth/change-password";





/* =========================================================

   PROFILE COMPONENT

========================================================= */



function Profile() {



    /* =========================================================

       PROFILE STATE

    ========================================================= */



    const [showEdit, setShowEdit] =

        useState(false);



    const [showPassword, setShowPassword] =

        useState(false);





    const [name, setName] =

        useState("");



    const [email, setEmail] =

        useState("");



    const [description, setDescription] =

        useState(

            "Building consistency every day 🚀"

        );





    /* =========================================================

       ORIGINAL PROFILE VALUES

    ========================================================= */



    const [originalName, setOriginalName] =

        useState("");



    const [originalEmail, setOriginalEmail] =

        useState("");





    /* =========================================================

       PASSWORD STATE

    ========================================================= */



    const [oldPassword, setOldPassword] =

        useState("");



    const [newPassword, setNewPassword] =

        useState("");



    const [confirmPassword, setConfirmPassword] =

        useState("");





    /* =========================================================

       UI STATE

    ========================================================= */



    const [loading, setLoading] =

        useState(true);



    const [saving, setSaving] =

        useState(false);



    const [passwordSaving, setPasswordSaving] =

        useState(false);



    const [error, setError] =

        useState("");



    const [success, setSuccess] =

        useState("");





    /* =========================================================

       GET TOKEN

    ========================================================= */



    const getToken = () => {



        return localStorage.getItem(

            "token"

        );



    };





    /* =========================================================

       LOAD PROFILE

    ========================================================= */



    const loadProfile = async () => {



        try {



            setLoading(true);



            setError("");





            const token =

                getToken();





            if (!token) {



                window.location.href =

                    "/login";



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





            /*

             * Expected backend response:

             *

             * {

             *     user: {

             *         name: "...",

             *         email: "..."

             *     }

             * }

             */



            const user =

                data.user;





            setName(

                user.name || ""

            );



            setEmail(

                user.email || ""

            );



            setDescription(

                user.description || "Building consistency every day 🚀"

            );





            setOriginalName(

                user.name || ""

            );



            setOriginalEmail(

                user.email || ""

            );





        } catch (error) {



            console.error(

                "Unable to load profile:",

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

       INITIAL LOAD

    ========================================================= */



    useEffect(() => {



        loadProfile();



    }, []);





    /* =========================================================

       SAVE PROFILE

    ========================================================= */



    const handleProfileSave =

        async (e) => {



            e.preventDefault();





            try {



                setSaving(true);



                setError("");



                setSuccess("");





                const token =

                    getToken();





                if (!token) {



                    window.location.href =

                        "/login";



                    return;



                }





                const response =

                    await fetch(

                        UPDATE_PROFILE_API,

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

                                    name:

                                        name.trim(),



                                    email:

                                        email.trim(),



                                    description:

                                        description.trim()

                                })

                        }

                    );





                const data =

                    await response.json();





                if (!response.ok) {



                    throw new Error(

                        data.message ||

                        "Unable to update profile"

                    );



                }





                const updatedUser =

                    data.user;





                setName(

                    updatedUser.name

                );



                setEmail(

                    updatedUser.email

                );



                setDescription(

                    updatedUser.description || ""

                );





                setOriginalName(

                    updatedUser.name

                );



                setOriginalEmail(

                    updatedUser.email

                );





                setShowEdit(false);



                setSuccess(

                    "Profile updated successfully."

                );





                /*

                 * Automatically remove

                 * success message.

                 */



                setTimeout(() => {



                    setSuccess("");



                }, 3000);





            } catch (error) {



                console.error(

                    "Unable to update profile:",

                    error

                );



                setError(

                    error.message

                );



            } finally {



                setSaving(false);



            }



        };





    /* =========================================================

       CHANGE PASSWORD

    ========================================================= */



    const handlePasswordChange =

        async (e) => {



            e.preventDefault();





            setError("");



            setSuccess("");





            if (

                newPassword !==

                confirmPassword

            ) {



                setError(

                    "New passwords do not match."

                );



                return;



            }





            if (

                newPassword.length < 6

            ) {



                setError(

                    "New password must be at least 6 characters."

                );



                return;



            }





            try {



                setPasswordSaving(true);





                const token =

                    getToken();





                if (!token) {



                    window.location.href =

                        "/login";



                    return;



                }





                const response =

                    await fetch(

                        PASSWORD_API,

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



                                    currentPassword:

                                        oldPassword,



                                    newPassword:

                                        newPassword



                                })

                        }

                    );





                const data =

                    await response.json();





                if (!response.ok) {



                    throw new Error(

                        data.message ||

                        "Unable to change password"

                    );



                }





                setOldPassword("");



                setNewPassword("");



                setConfirmPassword("");



                setShowPassword(false);





                setSuccess(

                    "Password changed successfully."

                );





                setTimeout(() => {



                    setSuccess("");



                }, 3000);





            } catch (error) {



                console.error(

                    "Unable to change password:",

                    error

                );



                setError(

                    error.message

                );



            } finally {



                setPasswordSaving(false);



            }



        };





    /* =========================================================

       LOGOUT

    ========================================================= */



    const handleLogout = () => {



        localStorage.removeItem(

            "token"

        );



        window.location.href =

            "/login";



    };





    /* =========================================================

       OPEN EDIT MODAL

    ========================================================= */



    const openEditProfile = () => {



        setError("");



        setSuccess("");



        setName(

            originalName

        );



        setEmail(

            originalEmail

        );



        setShowEdit(true);



    };





    /* =========================================================

       OPEN PASSWORD MODAL

    ========================================================= */



    const openPasswordModal = () => {



        setError("");



        setSuccess("");



        setOldPassword("");



        setNewPassword("");



        setConfirmPassword("");



        setShowPassword(true);



    };





    /* =========================================================

       PROFILE INITIAL

    ========================================================= */



    const profileInitial =

        name

            ? name

                .charAt(0)

                .toUpperCase()

            : "U";





    /* =========================================================

       RENDER

    ========================================================= */



    return (



        <div className="main-layout">



            <div className="profile-home">





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





                    {/* =================================================

                        RIGHT NAV

                    ================================================= */}



                    <div className="nav-right">









                        {/* Profile circle = Profile button */}



                        <Link

                            to="/profile"

                            className="profile-link"

                        >



                            <div className="navbar-profile">



                                {profileInitial}



                            </div>



                        </Link>



                    </div>



                </nav>





                {/* =================================================

                    PROFILE CONTENT

                ================================================= */}



                <main className="profile-page">





                    {/* =================================================

                        PAGE HEADER

                    ================================================= */}



                    <div className="profile-heading">



                        <div>



                            <h1>

                                Profile

                            </h1>



                            <p>

                                Manage your Momentum account

                            </p>



                        </div>



                    </div>





                    {/* =================================================

                        SUCCESS MESSAGE

                    ================================================= */}



                    {success && (



                        <div className="success-message">



                            ✓ {success}



                        </div>



                    )}





                    {/* =================================================

                        ERROR MESSAGE

                    ================================================= */}



                    {error && (



                        <div className="profile-error">



                            {error}



                        </div>



                    )}





                    {/* =================================================

                        PROFILE CARD

                    ================================================= */}



                    <section className="profile-card">





                        {/* =================================================

                            AVATAR

                        ================================================= */}



                        <div className="profile-avatar-wrapper">



                            <div className="profile-avatar">



                                {loading

                                    ? "..."

                                    : profileInitial}



                            </div>





                            <button

                                type="button"

                                className="avatar-edit-btn"

                                onClick={

                                    openEditProfile

                                }

                                title="Edit profile"

                            >

                                ✎

                            </button>



                        </div>





                        {/* =================================================

                            USER INFORMATION

                        ================================================= */}



                        <div className="profile-info">



                            {loading ? (



                                <>



                                    <h2>

                                        Loading...

                                    </h2>



                                    <p className="profile-email">

                                        Loading profile

                                    </p>



                                </>



                            ) : (



                                <>



                                    <h2>

                                        {name}

                                    </h2>





                                    <p className="profile-email">

                                        {email}

                                    </p>





                                    <p className="profile-description">

                                        {description}

                                    </p>



                                </>



                            )}



                        </div>





                        {/* =================================================

                            PROFILE ACTIONS

                        ================================================= */}



                        <div className="profile-actions">





                            {/* Edit Profile */}



                            <button

                                type="button"

                                className="profile-btn primary-btn"

                                onClick={

                                    openEditProfile

                                }

                                disabled={loading}

                            >

                                ✎ Edit Profile

                            </button>





                            {/* Change Password */}



                            <button

                                type="button"

                                className="profile-btn secondary-btn"

                                onClick={

                                    openPasswordModal

                                }

                                disabled={loading}

                            >

                                🔒 Change Password

                            </button>





                            {/* Logout */}



                            <button

                                type="button"

                                className="profile-btn logout-profile-btn"

                                onClick={

                                    handleLogout

                                }

                            >

                                ↪ Log Out

                            </button>



                        </div>



                    </section>

                    {/* =================================================
                        FEEDBACK / SUGGESTIONS
                    ================================================= */}

                    <section className="feedback-card">
                        <div className="feedback-content">
                            <div>
                                <h3>Have a suggestion?</h3>
                                <p>
                                    Help us make Momentum better by sharing your
                                    ideas, suggestions, or improvements.
                                </p>
                            </div>

                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSeTmbd6B1Uwc32s7Sei4zE1VmueWnX3DMI2-ElFOMo_h_LtDw/viewform?usp=publish-editor"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="feedback-link"
                            >
                                Provide Feedback
                            </a>
                        </div>
                    </section>




                </main>





                {/* =================================================

                    EDIT PROFILE MODAL

                ================================================= */}



                {showEdit && (



                    <div

                        className="profile-modal-overlay"

                        onClick={() =>

                            setShowEdit(false)

                        }

                    >



                        <div

                            className="profile-modal"

                            onClick={(e) =>

                                e.stopPropagation()

                            }

                        >



                            <div className="modal-header">



                                <div>



                                    <h2>

                                        Edit Profile

                                    </h2>



                                    <p>

                                        Update your personal information

                                    </p>



                                </div>





                                <button

                                    type="button"

                                    className="modal-close"

                                    onClick={() =>

                                        setShowEdit(false)

                                    }

                                >

                                    ×

                                </button>



                            </div>





                            <form

                                onSubmit={

                                    handleProfileSave

                                }

                            >



                                {/* Full Name */}



                                <div className="form-group">



                                    <label>

                                        Full Name

                                    </label>



                                    <input

                                        type="text"

                                        value={name}

                                        onChange={(e) =>

                                            setName(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Enter your name"

                                        required

                                    />



                                </div>





                                {/* Email */}



                                <div className="form-group">



                                    <label>

                                        Email

                                    </label>



                                    <input

                                        type="email"

                                        value={email}

                                        onChange={(e) =>

                                            setEmail(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Enter your email"

                                        required

                                    />



                                </div>





                                {/* description */}



                                <div className="form-group">



                                    <label>

                                        Description

                                    </label>



                                    <input

                                        type="text"

                                        value={description}

                                        onChange={(e) =>

                                            setDescription(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Enter your description"

                                    />



                                </div>





                                <div className="modal-actions">



                                    <button

                                        type="button"

                                        className="cancel-btn"

                                        onClick={() =>

                                            setShowEdit(false)

                                        }

                                    >

                                        Cancel

                                    </button>





                                    <button

                                        type="submit"

                                        className="save-btn"

                                        disabled={saving}

                                    >



                                        {saving

                                            ? "Saving..."

                                            : "Save Changes"}



                                    </button>



                                </div>



                            </form>



                        </div>



                    </div>



                )}





                {/* =================================================

                    CHANGE PASSWORD MODAL

                ================================================= */}



                {showPassword && (



                    <div

                        className="profile-modal-overlay"

                        onClick={() =>

                            setShowPassword(false)

                        }

                    >



                        <div

                            className="profile-modal"

                            onClick={(e) =>

                                e.stopPropagation()

                            }

                        >



                            <div className="modal-header">



                                <div>



                                    <h2>

                                        Change Password

                                    </h2>



                                    <p>

                                        Keep your Momentum account secure

                                    </p>



                                </div>





                                <button

                                    type="button"

                                    className="modal-close"

                                    onClick={() =>

                                        setShowPassword(false)

                                    }

                                >

                                    ×

                                </button>



                            </div>





                            <form

                                onSubmit={

                                    handlePasswordChange

                                }

                            >



                                {/* Current Password */}



                                <div className="form-group">



                                    <label>

                                        Current Password

                                    </label>



                                    <input

                                        type="password"

                                        value={oldPassword}

                                        onChange={(e) =>

                                            setOldPassword(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Enter current password"

                                        required

                                    />



                                </div>





                                {/* New Password */}



                                <div className="form-group">



                                    <label>

                                        New Password

                                    </label>



                                    <input

                                        type="password"

                                        value={newPassword}

                                        onChange={(e) =>

                                            setNewPassword(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Enter new password"

                                        required

                                        minLength="6"

                                    />



                                </div>





                                {/* Confirm Password */}



                                <div className="form-group">



                                    <label>

                                        Confirm New Password

                                    </label>



                                    <input

                                        type="password"

                                        value={confirmPassword}

                                        onChange={(e) =>

                                            setConfirmPassword(

                                                e.target.value

                                            )

                                        }

                                        placeholder="Confirm new password"

                                        required

                                        minLength="6"

                                    />



                                </div>





                                <div className="modal-actions">



                                    <button

                                        type="button"

                                        className="cancel-btn"

                                        onClick={() =>

                                            setShowPassword(false)

                                        }

                                    >

                                        Cancel

                                    </button>





                                    <button

                                        type="submit"

                                        className="save-btn"

                                        disabled={

                                            passwordSaving

                                        }

                                    >



                                        {passwordSaving

                                            ? "Updating..."

                                            : "Update Password"}



                                    </button>



                                </div>



                            </form>



                        </div>



                    </div>



                )}



            </div>



        </div>



    );



}





export default Profile;