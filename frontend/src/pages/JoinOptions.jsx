import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import styles from '../styles/homePage.module.css';

function JoinOptionsPage() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [statusText, setStatusText] = useState('');

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

    return (
        <div className={styles.homeShell}>
            <div className={styles.homeBackdrop}></div>

            <header className={styles.homeHeader}>
                <div>
                    <p className={styles.kicker}>Join meeting</p>
                    <h1>Join with code or link</h1>
                </div>

                <div className={styles.headerActions}>
                    <button type='button' className={styles.headerButton} onClick={() => navigate('/home')}>
                        <ArrowBackRoundedIcon />
                        <span>Back to home</span>
                    </button>
                </div>
            </header>

            <main className={styles.homeGrid}>
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

export default withAuth(JoinOptionsPage);
