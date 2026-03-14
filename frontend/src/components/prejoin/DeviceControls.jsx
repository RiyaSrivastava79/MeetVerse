import React from 'react';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import styles from '../../styles/prejoin.module.css';

export default function DeviceControls({
    displayName,
    onNameChange,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    onCameraSelect,
    onMicrophoneSelect,
    cameraEnabled,
    microphoneEnabled,
    onToggleCamera,
    onToggleMicrophone,
    cameraPermission,
    microphonePermission
}) {
    return (
        <div className={styles.controlsPanel}>
            <div className={styles.devicesHeader}>
                <div className={styles.devicesHeading}>
                    <SettingsRoundedIcon />
                    <span>Device setup</span>
                </div>
                {microphonePermission === 'denied' ? (
                    <div className={styles.permissionWarning}>
                        <WarningAmberRoundedIcon />
                        <span>Microphone access is blocked</span>
                    </div>
                ) : null}
            </div>

            <div className={styles.inputGrid}>
                <label className={styles.fieldGroup}>
                    <span>Your name</span>
                    <input
                        value={displayName}
                        onChange={(event) => onNameChange(event.target.value)}
                        placeholder='Enter name'
                    />
                </label>

                <label className={styles.fieldGroup}>
                    <span>Camera</span>
                    <select
                        value={selectedCameraId}
                        onChange={(event) => onCameraSelect(event.target.value)}
                        disabled={!cameras.length || cameraPermission === 'denied'}
                    >
                        {!cameras.length ? <option value=''>No camera detected</option> : null}
                        {cameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || 'Camera'}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.fieldGroup}>
                    <span>Microphone</span>
                    <select
                        value={selectedMicrophoneId}
                        onChange={(event) => onMicrophoneSelect(event.target.value)}
                        disabled={!microphones.length || microphonePermission === 'denied'}
                    >
                        {!microphones.length ? <option value=''>No microphone detected</option> : null}
                        {microphones.map((microphone) => (
                            <option key={microphone.deviceId} value={microphone.deviceId}>
                                {microphone.label || 'Microphone'}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className={styles.controlRow}>
                <button
                    type='button'
                    className={`${styles.circleControl} ${microphoneEnabled ? styles.controlActive : styles.controlMuted}`}
                    onClick={onToggleMicrophone}
                    aria-label={microphoneEnabled ? 'Turn microphone off' : 'Turn microphone on'}
                >
                    {microphoneEnabled ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
                </button>

                <button
                    type='button'
                    className={`${styles.circleControl} ${cameraEnabled ? styles.controlActive : styles.controlMuted}`}
                    onClick={onToggleCamera}
                    aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                >
                    {cameraEnabled ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
                </button>
            </div>
        </div>
    );
}