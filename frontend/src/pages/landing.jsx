import React, { useMemo, useRef, useState } from 'react'
import "../App.css"
import { useNavigate } from 'react-router-dom'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AddIcCallRoundedIcon from '@mui/icons-material/AddIcCallRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
export default function LandingPage() {


    const router = useNavigate();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('av_theme') !== 'light');
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [generatedMeetingCode, setGeneratedMeetingCode] = useState('');
    const [statusText, setStatusText] = useState('');
    const guestSectionRef = useRef(null);

    const createMeetingCode = () => `room-${Math.random().toString(36).slice(2, 8)}`;

    const generatedJoinLink = useMemo(() => {
        if (!generatedMeetingCode) {
            return '';
        }

        return `${window.location.origin}/prejoin/${generatedMeetingCode}`;
    }, [generatedMeetingCode]);

    const openGuestOptions = () => {
        guestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const extractMeetingCode = (value) => {
        const input = value.trim();

        if (!input) {
            return '';
        }

        const fromPath = (pathValue) => {
            const segments = pathValue.split('/').filter(Boolean);

            if (!segments.length) {
                return '';
            }

            if (segments[0] === 'prejoin' && segments[1]) {
                return segments[1];
            }

            return segments[0];
        };

        if (input.startsWith('http://') || input.startsWith('https://')) {
            try {
                const parsed = new URL(input);
                return fromPath(parsed.pathname);
            } catch (error) {
                return '';
            }
        }

        return fromPath(input);
    };

    const openPreJoin = () => {
        const meetingCode = createMeetingCode();
        router(`/prejoin/${meetingCode}`)
    }

    const handleGenerateMeeting = () => {
        const nextMeetingCode = createMeetingCode();
        setGeneratedMeetingCode(nextMeetingCode);
        setStatusText('Meeting code and link are ready. Share them or start the meeting now.');
    };

    const handleStartGeneratedMeeting = () => {
        if (!generatedMeetingCode) {
            return;
        }

        router(`/prejoin/${generatedMeetingCode}`);
    };

    const handleCopyGeneratedLink = async () => {
        if (!generatedJoinLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(generatedJoinLink);
            setStatusText('Meeting link copied successfully.');
        } catch (error) {
            console.log(error);
            setStatusText('Unable to copy the meeting link. Please copy it manually.');
        }
    };

    const handleShareGeneratedLink = async () => {
        if (!generatedJoinLink) {
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MeetVerse Meeting',
                    text: 'Join my MeetVerse meeting',
                    url: generatedJoinLink,
                });
                setStatusText('Meeting link shared successfully.');
                return;
            } catch (error) {
                console.log(error);
            }
        }

        handleCopyGeneratedLink();
    };

    const handleJoinByCode = () => {
        if (!meetingCode.trim()) {
            setStatusText('Please enter a meeting code.');
            return;
        }

        router(`/prejoin/${meetingCode.trim()}`);
    };

    const handleJoinByLink = () => {
        const codeFromLink = extractMeetingCode(meetingLink);

        if (!codeFromLink) {
            setStatusText('Invalid meeting link. Please paste a valid join link.');
            return;
        }

        router(`/prejoin/${codeFromLink}`);
    };

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
                    <h2>MeetVerse</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => {
                        openGuestOptions()
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

                    <p>Cover a distance by MeetVerse</p>
                    <div role='button' onClick={() => openGuestOptions()}>
                        <button type='button'>Get Started</button>
                    </div>
                </div>
                <div>

                    <img src="/mobile.png" alt="" />

                </div>
            </div>

            <section ref={guestSectionRef} className='landingGuestSection'>
                <div className='landingGuestHeader'>
                    <p>Guest access</p>
                    <h2>Generate meeting code/link or join with code/link</h2>
                </div>

                <div className='landingGuestGrid'>
                    <article className='landingGuestCard'>
                        <div className='landingGuestIcon'>
                            <AddIcCallRoundedIcon />
                        </div>
                        <h3>Create a meeting as guest</h3>
                        <p>Generate a fresh meeting code and join link without logging in.</p>

                        <button type='button' className='landingGuestPrimaryButton' onClick={handleGenerateMeeting}>
                            Generate meeting code
                        </button>

                        {generatedMeetingCode ? (
                            <div className='landingGeneratedBox'>
                                <label className='landingFieldGroup'>
                                    <span>Meeting code</span>
                                    <input value={generatedMeetingCode} readOnly />
                                </label>

                                <label className='landingFieldGroup'>
                                    <span>Meeting link</span>
                                    <input value={generatedJoinLink} readOnly />
                                </label>

                                <div className='landingGuestActions'>
                                    <button type='button' className='landingGuestSecondaryButton' onClick={handleCopyGeneratedLink}>
                                        <LinkRoundedIcon />
                                        <span>Copy link</span>
                                    </button>
                                    <button type='button' className='landingGuestSecondaryButton' onClick={handleShareGeneratedLink}>
                                        <SendRoundedIcon />
                                        <span>Share link</span>
                                    </button>
                                    <button type='button' className='landingGuestPrimaryButton' onClick={handleStartGeneratedMeeting}>
                                        Start now
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </article>

                    <article className='landingGuestCard'>
                        <div className='landingGuestIcon'>
                            <LinkRoundedIcon />
                        </div>
                        <h3>Join an existing meeting</h3>
                        <p>Paste a meeting code or full meeting link to enter the pre-join screen.</p>

                        <label className='landingFieldGroup'>
                            <span>Meeting code</span>
                            <input
                                type='text'
                                value={meetingCode}
                                onChange={(event) => setMeetingCode(event.target.value)}
                                placeholder='Enter room code'
                            />
                        </label>

                        <label className='landingFieldGroup'>
                            <span>Meeting link</span>
                            <input
                                type='text'
                                value={meetingLink}
                                onChange={(event) => setMeetingLink(event.target.value)}
                                placeholder='Paste meeting link'
                            />
                        </label>

                        <div className='landingGuestActions'>
                            <button type='button' className='landingGuestPrimaryButton' onClick={handleJoinByCode}>
                                Join with code
                            </button>
                            <button type='button' className='landingGuestLinkButton' onClick={handleJoinByLink}>
                                Join with link
                            </button>
                        </div>
                    </article>
                </div>

                {statusText ? <p className='landingStatusText'>{statusText}</p> : null}
            </section>



        </div>
    )
}