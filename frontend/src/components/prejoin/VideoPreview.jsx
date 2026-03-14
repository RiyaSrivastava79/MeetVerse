import React from 'react';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import styles from '../../styles/prejoin.module.css';

export default function VideoPreview({
    videoRef,
    cameraPermission,
    cameraEnabled,
    hasCameraDevices,
    displayName
}) {
    const showVideo = cameraPermission === 'granted' && cameraEnabled && hasCameraDevices;

    return (
        <div className={styles.previewPanel}>
            <div className={styles.previewGlow}></div>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={styles.previewVideo}
                style={{ display: showVideo ? 'block' : 'none' }}
            />

            {!showVideo ? (
                <div className={styles.previewFallback}>
                    <div className={styles.previewFallbackIcon}>
                        <VideocamOffRoundedIcon />
                    </div>
                    <h3>Camera preview unavailable</h3>
                    <p>
                        {cameraPermission === 'denied'
                            ? 'Camera access is blocked. You can still join with audio or enable it from your browser settings.'
                            : 'Turn your camera on to see a live preview before you join.'}
                    </p>
                </div>
            ) : null}

            <div className={styles.previewNameBadge}>{displayName || 'Enter name'}</div>
        </div>
    );
}