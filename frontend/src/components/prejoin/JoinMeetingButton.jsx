import React from 'react';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import styles from '../../styles/prejoin.module.css';

export default function JoinMeetingButton({ onJoin, disabled }) {
    return (
        <button
            type='button'
            className={styles.joinButton}
            onClick={onJoin}
            disabled={disabled}
        >
            <VideoCallRoundedIcon />
            <span>Join Meeting</span>
        </button>
    );
}