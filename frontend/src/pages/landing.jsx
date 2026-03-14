import React, { useState } from 'react'
import "../App.css"
import { useNavigate } from 'react-router-dom'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
export default function LandingPage() {


    const router = useNavigate();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('av_theme') !== 'light');

    const createMeetingCode = () => `room-${Math.random().toString(36).slice(2, 8)}`;

    const openPreJoin = () => {
        const meetingCode = createMeetingCode();
        router(`/prejoin/${meetingCode}`)
    }

    const toggleTheme = () => {
        setDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('av_theme', next ? 'dark' : 'light');
            return next;
        });
    };

    return (
        <div className={`landingPageContainer ${darkMode ? '' : 'landingLight'}`}>
            <nav>
                <div className='navHeader'>
                    <h2>Apna Video Call</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => {
                        openPreJoin()
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        router('/auth?mode=register')

                    }}>Register</p>
                    <div onClick={() => {
                        router('/auth?mode=login')

                    }} role='button'>
                        <p>Login</p>
                    </div>
                    <button type='button' className='landingThemeToggle' onClick={toggleTheme} aria-label='Toggle theme'>
                        {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                    </button>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>

                    <p>Cover a distance by Apna Video Call</p>
                    <div role='button' onClick={() => openPreJoin()}>
                        <button type='button'>Get Started</button>
                    </div>
                </div>
                <div>

                    <img src="/mobile.png" alt="" />

                </div>
            </div>



        </div>
    )
}