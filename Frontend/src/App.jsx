import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import Analytics from "./Pages/Analytics";
import Calendar from "./Pages/Calendar";
import DailyTasks from "./Pages/DailyTasks";
import Timetable from "./Pages/Timetable";
import Profile from "./Pages/Profile";
import './App.css'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />}/>
          <Route path="/home" element={<Home />}/>
          <Route path="/Login" element={<Login />}/>
          <Route path="/analytics" element={<Analytics />}/>
          <Route path="/calendar" element={<Calendar />}/>
          <Route path="/daily" element={<DailyTasks />}/>
          <Route path="/timetable" element={<Timetable />}/>
          <Route path="/profile" element={<Profile />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
