import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import styles from '../styles/historyPage.module.css';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // silent
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className={styles.shell}>
            <div className={styles.inner}>
                <div className={styles.header}>
                    <button type='button' className={styles.backButton} onClick={() => navigate('/home')}>
                        <ArrowBackRoundedIcon />
                    </button>
                    <div className={styles.headerText}>
                        <span className={styles.kicker}>Your activity</span>
                        <h1>Meeting History</h1>
                        <p>{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded</p>
                    </div>
                </div>

                {meetings.length === 0 ? (
                    <div className={styles.empty}>
                        <MeetingRoomRoundedIcon />
                        <p>No meetings recorded yet. Join or create a meeting to see history here.</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {meetings.map((meeting, index) => (
                            <div className={styles.card} key={meeting._id || index}>
                                <div className={styles.iconWrap}>
                                    <VideoCallRoundedIcon />
                                </div>

                                <div className={styles.cardBody}>
                                    <p className={styles.meetingCode}>{meeting.meetingCode}</p>
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>
                                            <CalendarTodayRoundedIcon />
                                            {formatDate(meeting.date)}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <AccessTimeRoundedIcon />
                                            {formatTime(meeting.date)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type='button'
                                    className={styles.rejoinButton}
                                    onClick={() => navigate(`/prejoin/${meeting.meetingCode}`)}
                                >
                                    Rejoin
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
