import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import JoinMeetingButton from '../components/prejoin/JoinMeetingButton';
import VideoPreview from '../components/prejoin/VideoPreview';
import styles from '../styles/prejoin.module.css';

const initialPermissions = {
    camera: 'prompt',
    microphone: 'prompt'
};

const cookieKeys = {
    cameraEnabled: 'av_camera_enabled',
    microphoneEnabled: 'av_microphone_enabled'
};

const setCookieValue = (name, value, days = null) => {
    if (typeof document === 'undefined') {
        return;
    }

    const expires = typeof days === 'number'
        ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`
        : '';

    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
};

export default function PreJoinPage() {
    const navigate = useNavigate();
    const { meetingCode } = useParams();
    const [searchParams] = useSearchParams();
    const previewRef = useRef(null);
    const previewStreamRef = useRef(null);
    // Guards the reactive effect from firing before the init completes
    const isInitializedRef = useRef(false);
    const [displayName, setDisplayName] = useState('');
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
    const [permissions, setPermissions] = useState(initialPermissions);
    const [showPermissionPopup, setShowPermissionPopup] = useState(false);
    const [pendingPermission, setPendingPermission] = useState(null); // 'mic' | 'camera'
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('av_theme') !== 'light');
    const [cameraDevices, setCameraDevices] = useState([]);
    const [microphoneDevices, setMicrophoneDevices] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('');

    const authMode = searchParams.get('authMode');
    const storageKey = `prejoin:${meetingCode}`;

    const stopStream = useCallback((stream) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => track.stop());
    }, []);

    const setPreview = useCallback((stream) => {
        previewStreamRef.current = stream;
        if (previewRef.current) {
            previewRef.current.srcObject = stream || null;
        }
    }, []);

    // Stable helper — receives all values as explicit args so it never needs to
    // close over changing state and never causes hook dependency loops.
    const applyPreview = useCallback(async ({ camEnabled, micEnabled, camPerm, micPerm, camId, micId }) => {
        const constraints = {
            video: camEnabled && camPerm === 'granted'
                ? camId ? { deviceId: { exact: camId } } : true
                : false,
            audio: micEnabled && micPerm === 'granted'
                ? micId ? { deviceId: { exact: micId } } : true
                : false,
        };

        if (!constraints.video && !constraints.audio) {
            stopStream(previewStreamRef.current);
            setPreview(null);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stopStream(previewStreamRef.current);
            setPreview(stream);
        } catch (error) {
            console.log(error);
        }
    }, [stopStream, setPreview]);

    const getPermissionState = useCallback(async (permissionName) => {
        if (!navigator.permissions?.query) return 'prompt';
        try {
            const result = await navigator.permissions.query({ name: permissionName });
            return result.state;
        } catch (error) {
            return 'prompt';
        }
    }, []);

    const updateDeviceLists = useCallback(async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const nextCameras = devices.filter((device) => device.kind === 'videoinput');
        const nextMicrophones = devices.filter((device) => device.kind === 'audioinput');
        const camId = nextCameras[0]?.deviceId || '';
        const micId = nextMicrophones[0]?.deviceId || '';

        setCameraDevices(nextCameras);
        setMicrophoneDevices(nextMicrophones);

        return { cameras: nextCameras, microphones: nextMicrophones, camId, micId };
    }, []);

    const requestPermissionFor = useCallback(async (type) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ [type]: true });
            stopStream(stream);
            return 'granted';
        } catch (error) {
            return error?.name === 'NotAllowedError' ? 'denied' : 'unavailable';
        }
    }, [stopStream]);

    // Runs exactly once on mount. All deps here are stable (useCallback with []).
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            const camPerm = await getPermissionState('camera');
            const micPerm = await getPermissionState('microphone');

            if (!isMounted) return;

            const nextPerms = { camera: camPerm, microphone: micPerm };
            const camEnabled = false;
            const micEnabled = false;

            setPermissions(nextPerms);
            setCameraEnabled(camEnabled);
            setMicrophoneEnabled(micEnabled);

            const { camId, micId } = await updateDeviceLists();

            if (!isMounted) return;

            setSelectedCameraId(camId);
            setSelectedMicrophoneId(micId);

            await applyPreview({ camEnabled, micEnabled, camPerm, micPerm, camId, micId });

            if (isMounted) {
                isInitializedRef.current = true;
            }
        };

        init();

        return () => {
            isMounted = false;
            stopStream(previewStreamRef.current);
        };
    }, [applyPreview, getPermissionState, stopStream, updateDeviceLists]);

    // Reactive effect — only fires after init, debounced so rapid state
    // batches (e.g. from requestCameraAndMicAccess) don't cause double streams.
    useEffect(() => {
        if (!isInitializedRef.current) return;

        const timer = setTimeout(() => {
            applyPreview({
                camEnabled: cameraEnabled,
                micEnabled: microphoneEnabled,
                camPerm: permissions.camera,
                micPerm: permissions.microphone,
                camId: selectedCameraId,
                micId: selectedMicrophoneId,
            });
        }, 80);

        return () => clearTimeout(timer);
    }, [applyPreview, cameraEnabled, microphoneEnabled, permissions.camera, permissions.microphone, selectedCameraId, selectedMicrophoneId]);

    useEffect(() => {
        setCookieValue(cookieKeys.cameraEnabled, String(cameraEnabled));
    }, [cameraEnabled]);

    useEffect(() => {
        setCookieValue(cookieKeys.microphoneEnabled, String(microphoneEnabled));
    }, [microphoneEnabled]);

    const requestSpecificAccess = useCallback(async () => {
        if (!pendingPermission) return;

        const isMic = pendingPermission === 'mic';
        const mediaType = isMic ? 'audio' : 'video';
        const permKey = isMic ? 'microphone' : 'camera';

        const perm = await requestPermissionFor(mediaType);

        isInitializedRef.current = true;

        const nextPerms = { ...permissions, [permKey]: perm };
        setPermissions(nextPerms);

        if (perm === 'granted') {
            if (isMic) setMicrophoneEnabled(true);
            else setCameraEnabled(true);
        }

        setShowPermissionPopup(false);
        setPendingPermission(null);

        const { camId, micId } = await updateDeviceLists();
        setSelectedCameraId((prev) => prev || camId);
        setSelectedMicrophoneId((prev) => prev || micId);
    }, [pendingPermission, permissions, requestPermissionFor, updateDeviceLists]);

    const handleToggleCamera = () => {
        if (!cameraEnabled) {
            setPendingPermission('camera');
            setShowPermissionPopup(true);
            return;
        }
        setCameraEnabled(false);
    };

    const handleToggleMicrophone = () => {
        if (!microphoneEnabled) {
            setPendingPermission('mic');
            setShowPermissionPopup(true);
            return;
        }
        setMicrophoneEnabled(false);
    };

    const handleJoinMeeting = () => {
        const prejoinConfig = {
            username: displayName.trim() || 'Participant',
            video: cameraEnabled && permissions.camera === 'granted',
            audio: microphoneEnabled && permissions.microphone === 'granted',
            videoPermission: permissions.camera,
            audioPermission: permissions.microphone,
            videoDeviceId: selectedCameraId,
            audioDeviceId: selectedMicrophoneId
        };

        sessionStorage.setItem(storageKey, JSON.stringify(prejoinConfig));
        stopStream(previewStreamRef.current);

        if ((authMode === 'login' || authMode === 'register') && !localStorage.getItem('token')) {
            navigate(`/auth?mode=${authMode}&redirect=/${meetingCode}`);
            return;
        }

        navigate(`/${meetingCode}`, {
            state: {
                prejoinConfig
            }
        });
    };

    return (
        <div className={`${styles.preJoinShell} ${darkMode ? '' : styles.lightShell}`}>
            {showPermissionPopup ? (
                <div className={styles.modalOverlay}>
                    <section className={styles.permissionPopup}>
                        <div className={styles.popupIconWrap}>
                            {pendingPermission === 'mic' ? <MicRoundedIcon /> : <VideocamRoundedIcon />}
                        </div>
                        <h2>
                            {pendingPermission === 'mic' ? 'Allow microphone access' : 'Allow camera access'}
                        </h2>
                        <p>
                            {pendingPermission === 'mic'
                                ? 'Allow Apna Video Call to use your microphone for this meeting.'
                                : 'Allow Apna Video Call to use your camera for this meeting.'}
                        </p>
                        <div className={styles.permissionActions}>
                            <button type='button' className={styles.allowButton} onClick={requestSpecificAccess}>
                                Allow while using app
                            </button>
                            <button type='button' className={styles.allowButton} onClick={requestSpecificAccess}>
                                For this time only
                            </button>
                            <button
                                type='button'
                                className={styles.skipButton}
                                onClick={() => { setShowPermissionPopup(false); setPendingPermission(null); }}
                            >
                                Don't allow
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            <div className={styles.preJoinInner}>
                <div className={styles.topMeta}>
                    <div className={styles.brandBlock}>
                        <h1>Ready before you join</h1>
                        <p>Check your camera and enter the meeting with the right setup.</p>
                    </div>

                    <div className={styles.topMetaRight}>
                        <div className={styles.roomBadge}>
                            <span>Meeting code</span>
                            <p>{meetingCode}</p>
                        </div>
                        <button type='button' className={styles.themeToggle} onClick={toggleTheme} aria-label='Toggle theme'>
                            {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                        </button>
                    </div>
                </div>

                <div className={styles.contentCard}>
                    <VideoPreview
                        videoRef={previewRef}
                        cameraPermission={permissions.camera}
                        cameraEnabled={cameraEnabled}
                        hasCameraDevices={cameraDevices.length > 0}
                        displayName={displayName}
                    />

                    <div className={styles.controlsPanel}>
                        <label className={styles.fieldGroup}>
                            <span>Your name</span>
                            <input
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                placeholder='Enter name'
                            />
                        </label>
                    </div>

                    <div className={styles.controlRow}>
                        <button
                            type='button'
                            className={`${styles.circleControl} ${microphoneEnabled ? styles.controlActive : styles.controlMuted}`}
                            onClick={handleToggleMicrophone}
                            aria-label={microphoneEnabled ? 'Turn microphone off' : 'Turn microphone on'}
                        >
                            {microphoneEnabled ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
                        </button>

                        <button
                            type='button'
                            className={`${styles.circleControl} ${cameraEnabled ? styles.controlActive : styles.controlMuted}`}
                            onClick={handleToggleCamera}
                            aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                        >
                            {cameraEnabled ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
                        </button>
                    </div>

                    <div className={styles.footerBar}>
                        <JoinMeetingButton onJoin={handleJoinMeeting} disabled={!displayName.trim()} />
                    </div>
                </div>
            </div>
        </div>
    );

    function toggleTheme() {
        setDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('av_theme', next ? 'dark' : 'light');
            return next;
        });
    }
}