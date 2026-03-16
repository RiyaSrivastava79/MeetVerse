import React, { useMemo, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import RestoreIcon from '@mui/icons-material/Restore';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AddIcCallRoundedIcon from '@mui/icons-material/AddIcCallRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import styles from '../styles/homePage.module.css';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [generatedMeetingCode, setGeneratedMeetingCode] = useState('');
    const [copyMessage, setCopyMessage] = useState('');

    const joinLink = useMemo(() => {
        if (!generatedMeetingCode) {
            return '';
        }

        return `${window.location.origin}/prejoin/${generatedMeetingCode}`;
    }, [generatedMeetingCode]);

    const createMeetingCode = () => `room-${Math.random().toString(36).slice(2, 8)}`;

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

    const handleJoinVideoCall = () => {
        if (!meetingCode.trim()) {
            return;
        }

        navigate(`/prejoin/${meetingCode.trim()}`);
    };

    const handleJoinByLink = () => {
        const codeFromLink = extractMeetingCode(meetingLink);

        if (!codeFromLink) {
            setCopyMessage('Invalid meeting link. Please paste a valid join link.');
            return;
        }

        navigate(`/prejoin/${codeFromLink}`);
    };

    const handleCreateMeeting = () => {
        const nextMeetingCode = createMeetingCode();
        setGeneratedMeetingCode(nextMeetingCode);
        setCopyMessage('Meeting is ready. Share the link or join now.');
    };

    const handleCopyLink = async () => {
        if (!joinLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(joinLink);
            setCopyMessage('Join link copied successfully.');
        } catch (error) {
            console.log(error);
            setCopyMessage('Unable to copy the link. Please copy and share it manually.');
        }
    };

    const handleShareLink = async () => {
        if (!joinLink) {
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MeetVerse Meeting',
                    text: 'Join my MeetVerse meeting',
                    url: joinLink,
                });
                setCopyMessage('Meeting link shared.');
                return;
            } catch (error) {
                console.log(error);
            }
        }

        handleCopyLink();
    };

    const handleStartCreatedMeeting = () => {
        if (!generatedMeetingCode) {
            return;
        }

        navigate(`/prejoin/${generatedMeetingCode}`);
    };

    return (
        <div className={styles.homeShell}>
            <div className={styles.homeBackdrop}></div>

            <header className={styles.homeHeader}>
                <div>
                    <p className={styles.kicker}>Dashboard</p>
                    <h1>You are logged in. Create a meeting or join an existing room.</h1>
                </div>

                <div className={styles.headerActions}>
                    <button type='button' className={styles.headerButton} onClick={() => navigate('/history')}>
                        <RestoreIcon />
                        <span>History</span>
                    </button>
                    <button
                        type='button'
                        className={styles.headerButton}
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/auth');
                        }}
                    >
                        <LogoutRoundedIcon />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className={styles.homeGrid}>
                <section className={styles.actionCard}>
                    <img src='/logo3.png' alt='Meeting logo' className={styles.meetingLogo} />
                    <div className={styles.cardIcon}><AddIcCallRoundedIcon /></div>
                    <h2>Create a new meeting</h2>
                    <p>Generate an instant meeting code, copy the join link, and send it to participants.</p>

                    <button type='button' className={styles.primaryButton} onClick={handleCreateMeeting}>
                        Generate meeting
                    </button>

                    {generatedMeetingCode ? (
                        <div className={styles.generatedBox}>
                            <label className={styles.readonlyField}>
                                <span>Meeting code</span>
                                <input value={generatedMeetingCode} readOnly />
                            </label>

                            <label className={styles.readonlyField}>
                                <span>Join link</span>
                                <input value={joinLink} readOnly />
                            </label>

                            <div className={styles.inlineActions}>
                                <button type='button' className={styles.secondaryButton} onClick={handleCopyLink}>
                                    <LinkRoundedIcon />
                                    <span>Copy link</span>
                                </button>
                                <button type='button' className={styles.secondaryButton} onClick={handleShareLink}>
                                    <SendRoundedIcon />
                                    <span>Share</span>
                                </button>
                                <button type='button' className={styles.primaryButton} onClick={handleStartCreatedMeeting}>
                                    Start now
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className={styles.actionCard}>
                    <div className={styles.cardIcon}><LinkRoundedIcon /></div>
                    <h2>Join existing meeting</h2>
                    <p>Join with either a meeting code or a full meeting link. Guest users can also join directly from the landing page.</p>

                    <label className={styles.fieldGroup}>
                        <span>Meeting code</span>
                        <input
                            type='text'
                            value={meetingCode}
                            onChange={(event) => setMeetingCode(event.target.value)}
                            placeholder='Enter room code'
                        />
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Meeting link</span>
                        <input
                            type='text'
                            value={meetingLink}
                            onChange={(event) => setMeetingLink(event.target.value)}
                            placeholder='Paste meeting link'
                        />
                    </label>

                    <div className={styles.inlineActions}>
                        <button type='button' className={styles.joinCodeButton} onClick={handleJoinVideoCall}>
                            Join with code
                        </button>
                        <button type='button' className={styles.joinLinkButton} onClick={handleJoinByLink}>
                            Join with link
                        </button>
                        <button type='button' className={styles.ghostButton} onClick={() => navigate('/')}>
                            Guest join page
                        </button>
                    </div>
                </section>
            </main>

            {copyMessage ? <p className={styles.statusText}>{copyMessage}</p> : null}
        </div>
    );
}

export default withAuth(HomeComponent);