import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AddIcCallRoundedIcon from '@mui/icons-material/AddIcCallRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import styles from '../styles/homePage.module.css';

function JoinOptionsPage() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [generatedMeetingCode, setGeneratedMeetingCode] = useState('');
    const [statusText, setStatusText] = useState('');

    const generatedJoinLink = useMemo(() => {
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

    const handleJoinByCode = () => {
        if (!meetingCode.trim()) {
            setStatusText('Please enter a meeting code.');
            return;
        }

        navigate(`/prejoin/${meetingCode.trim()}`);
    };

    const handleJoinByLink = () => {
        const codeFromLink = extractMeetingCode(meetingLink);

        if (!codeFromLink) {
            setStatusText('Invalid meeting link. Please paste a valid join link.');
            return;
        }

        navigate(`/prejoin/${codeFromLink}`);
    };

    const handleGenerateMeeting = () => {
        const nextMeetingCode = createMeetingCode();
        setGeneratedMeetingCode(nextMeetingCode);
        setStatusText('Meeting code and link are ready. Share them or start the meeting now.');
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

    const handleStartGeneratedMeeting = () => {
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
                    <p className={styles.kicker}>Guest access</p>
                    <h1>Create or join meeting as guest</h1>
                </div>

                <div className={styles.headerActions}>
                    <button type='button' className={styles.headerButton} onClick={() => navigate('/')}>
                        <ArrowBackRoundedIcon />
                        <span>Back to landing</span>
                    </button>
                </div>
            </header>

            <main className={styles.homeGrid}>
                <section className={styles.actionCard}>
                    <div className={styles.cardIcon}><AddIcCallRoundedIcon /></div>
                    <h2>Create a meeting as guest</h2>
                    <p>Generate a fresh meeting code and join link without logging in.</p>

                    <button type='button' className={styles.primaryButton} onClick={handleGenerateMeeting}>
                        Generate meeting code
                    </button>

                    {generatedMeetingCode ? (
                        <div className={styles.generatedBox}>
                            <label className={styles.readonlyField}>
                                <span>Meeting code</span>
                                <input value={generatedMeetingCode} readOnly />
                            </label>

                            <label className={styles.readonlyField}>
                                <span>Meeting link</span>
                                <input value={generatedJoinLink} readOnly />
                            </label>

                            <div className={styles.inlineActions}>
                                <button type='button' className={styles.secondaryButton} onClick={handleCopyGeneratedLink}>
                                    <LinkRoundedIcon />
                                    <span>Copy link</span>
                                </button>
                                <button type='button' className={styles.secondaryButton} onClick={handleShareGeneratedLink}>
                                    <SendRoundedIcon />
                                    <span>Share link</span>
                                </button>
                                <button type='button' className={styles.primaryButton} onClick={handleStartGeneratedMeeting}>
                                    Start now
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className={styles.actionCard}>
                    <div className={styles.cardIcon}><LinkRoundedIcon /></div>
                    <h2>Join existing meeting</h2>
                    <p>Use a meeting code or full meeting link to open the pre-join page.</p>

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
                        <button type='button' className={styles.primaryButton} onClick={handleJoinByCode}>
                            Join with code
                        </button>
                        <button type='button' className={styles.secondaryButton} onClick={handleJoinByLink}>
                            Join with link
                        </button>
                    </div>

                    {statusText ? <p className={styles.statusText}>{statusText}</p> : null}
                </section>
            </main>
        </div>
    );
}

export default JoinOptionsPage;
