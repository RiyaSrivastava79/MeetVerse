import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Badge, Button, IconButton, TextField } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles/videoComponent.module.css';
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext';

const server_url = server;
const connections = {};

const peerConfigConnections = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};

const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
};

const createPlaceholderStream = () => new MediaStream([black(), silence()]);

export default function VideoMeetComponent() {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoStateRef = useRef([]);
    const meetingConfigRef = useRef(null);
    const initializedRef = useRef(false);
    const historyRecordedRef = useRef(false);
    const chatEndRef = useRef(null);
    const usernameRef = useRef('Participant');

    const location = useLocation();
    const navigate = useNavigate();
    const { url } = useParams();
    const { addToUserHistory } = useContext(AuthContext);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [newMessages, setNewMessages] = useState(0);
    const [username, setUsername] = useState('Participant');
    const [videos, setVideos] = useState([]);
    const [isReady, setIsReady] = useState(false);

    const storageKey = `prejoin:${url}`;

    const stopTracks = (stream) => {
        if (!stream) {
            return;
        }

        stream.getTracks().forEach((track) => track.stop());
    };

    const emitDescription = useCallback((targetId, description) => {
        connections[targetId].setLocalDescription(description)
            .then(() => {
                socketRef.current.emit('signal', targetId, JSON.stringify({ sdp: connections[targetId].localDescription }));
            })
            .catch((error) => console.log(error));
    }, []);

    const renegotiateWithPeers = useCallback(() => {
        Object.keys(connections).forEach((id) => {
            if (id === socketIdRef.current) {
                return;
            }

            connections[id].addStream(window.localStream);
            connections[id].createOffer()
                .then((description) => emitDescription(id, description))
                .catch((error) => console.log(error));
        });
    }, [emitDescription]);

    const attachLocalStream = useCallback((stream) => {
        stopTracks(window.localStream);
        window.localStream = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }, []);

    const buildMediaConstraints = useCallback((nextVideo, nextAudio) => {
        const config = meetingConfigRef.current || {};

        return {
            video: nextVideo && videoAvailable
                ? config.videoDeviceId
                    ? { deviceId: { exact: config.videoDeviceId } }
                    : true
                : false,
            audio: nextAudio && audioAvailable
                ? config.audioDeviceId
                    ? { deviceId: { exact: config.audioDeviceId } }
                    : true
                : false
        };
    }, [audioAvailable, videoAvailable]);

    const refreshLocalMedia = useCallback(async (nextVideo, nextAudio) => {
        const constraints = buildMediaConstraints(nextVideo, nextAudio);

        if (!constraints.video && !constraints.audio) {
            attachLocalStream(createPlaceholderStream());
            renegotiateWithPeers();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            attachLocalStream(stream);
            renegotiateWithPeers();
        } catch (error) {
            console.log(error);
        }
    }, [attachLocalStream, buildMediaConstraints, renegotiateWithPeers]);

    const gotMessageFromServer = useCallback((fromId, payload) => {
        const signal = JSON.parse(payload);

        if (fromId === socketIdRef.current) {
            return;
        }

        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer()
                            .then((description) => emitDescription(fromId, description))
                            .catch((error) => console.log(error));
                    }
                })
                .catch((error) => console.log(error));
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((error) => console.log(error));
        }
    }, [emitDescription]);

    const addMessage = useCallback((data, sender, socketIdSender) => {
        // Skip server echo of own messages — we already show them optimistically
        if (socketIdSender === socketIdRef.current) return;
        setMessages((prevMessages) => [...prevMessages, { sender, data }]);
        setNewMessages((prevCount) => prevCount + 1);
    }, []);

    const connectToSocketServer = useCallback(() => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((prevVideos) => prevVideos.filter((item) => item.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        const existingVideo = remoteVideoStateRef.current.find((item) => item.socketId === socketListId);

                        if (existingVideo) {
                            setVideos((prevVideos) => {
                                const nextVideos = prevVideos.map((item) => (
                                    item.socketId === socketListId ? { ...item, stream: event.stream } : item
                                ));

                                remoteVideoStateRef.current = nextVideos;
                                return nextVideos;
                            });
                            return;
                        }

                        const nextVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true,
                            playsInline: true
                        };

                        setVideos((prevVideos) => {
                            const nextVideos = [...prevVideos, nextVideo];
                            remoteVideoStateRef.current = nextVideos;
                            return nextVideos;
                        });
                    };

                    connections[socketListId].addStream(window.localStream || createPlaceholderStream());
                });

                if (id === socketIdRef.current) {
                    Object.keys(connections).forEach((id2) => {
                        if (id2 === socketIdRef.current) {
                            return;
                        }

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (error) {
                            console.log(error);
                        }

                        connections[id2].createOffer()
                            .then((description) => emitDescription(id2, description))
                            .catch((error) => console.log(error));
                    });
                }
            });
        });
    }, [addMessage, emitDescription, gotMessageFromServer]);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        const incomingConfig = location.state?.prejoinConfig;
        const savedConfig = sessionStorage.getItem(storageKey);
        const resolvedConfig = incomingConfig || (savedConfig ? JSON.parse(savedConfig) : null);

        if (!resolvedConfig) {
            navigate(`/prejoin/${url}`, { replace: true });
            return;
        }

        initializedRef.current = true;
        meetingConfigRef.current = resolvedConfig;

        const initialVideo = Boolean(resolvedConfig.video && resolvedConfig.videoPermission !== 'denied');
        const initialAudio = Boolean(resolvedConfig.audio && resolvedConfig.audioPermission !== 'denied');

        setVideoAvailable(resolvedConfig.videoPermission !== 'denied');
        setAudioAvailable(resolvedConfig.audioPermission !== 'denied');
        setVideo(initialVideo);
        setAudio(initialAudio);
        setScreenAvailable(Boolean(navigator.mediaDevices.getDisplayMedia));
        const resolvedUsername = resolvedConfig.username || 'Participant';
        setUsername(resolvedUsername);
        usernameRef.current = resolvedUsername;

        const bootstrapMeeting = async () => {
            const constraints = {
                video: initialVideo
                    ? resolvedConfig.videoDeviceId
                        ? { deviceId: { exact: resolvedConfig.videoDeviceId } }
                        : true
                    : false,
                audio: initialAudio
                    ? resolvedConfig.audioDeviceId
                        ? { deviceId: { exact: resolvedConfig.audioDeviceId } }
                        : true
                    : false
            };

            try {
                const stream = constraints.video || constraints.audio
                    ? await navigator.mediaDevices.getUserMedia(constraints)
                    : createPlaceholderStream();

                attachLocalStream(stream);
            } catch (error) {
                console.log(error);
                attachLocalStream(createPlaceholderStream());
            }

            connectToSocketServer();
            setIsReady(true);

            if (localStorage.getItem('token') && !historyRecordedRef.current) {
                historyRecordedRef.current = true;
                addToUserHistory(url).catch((error) => console.log(error));
            }
        };

        bootstrapMeeting();
    }, [addToUserHistory, attachLocalStream, connectToSocketServer, location.state, navigate, storageKey, url]);

    useEffect(() => {
        if (screen) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then((stream) => {
                    attachLocalStream(stream);
                    renegotiateWithPeers();

                    stream.getTracks().forEach((track) => {
                        track.onended = () => {
                            setScreen(false);
                            refreshLocalMedia(video, audio);
                        };
                    });
                })
                .catch((error) => console.log(error));
        }
    }, [attachLocalStream, audio, refreshLocalMedia, renegotiateWithPeers, screen, video]);

    useEffect(() => () => {
        stopTracks(window.localStream);

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        Object.keys(connections).forEach((id) => {
            connections[id]?.close();
            delete connections[id];
        });
    }, []);

    // Auto-scroll chat to bottom whenever messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleVideo = () => {
        const nextVideo = !video;
        setVideo(nextVideo);
        refreshLocalMedia(nextVideo, audio);
    };

    const handleAudio = () => {
        const nextAudio = !audio;
        setAudio(nextAudio);
        refreshLocalMedia(video, nextAudio);
    };

    const handleScreen = () => {
        setScreen((current) => !current);
    };

    const handleEndCall = () => {
        stopTracks(localVideoRef.current?.srcObject);
        sessionStorage.removeItem(storageKey);
        navigate(localStorage.getItem('token') ? '/home' : '/', { replace: true });
    };

    const sendMessage = () => {
        const text = message.trim();
        if (!text) return;

        // Show message immediately in chat (optimistic update)
        setMessages((prev) => [...prev, { sender: usernameRef.current, data: text, self: true }]);
        setMessage('');

        // Emit to server so other participants receive it
        if (socketRef.current?.connected) {
            socketRef.current.emit('chat-message', text, usernameRef.current);
        }
    };

    const handleChatKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className={styles.meetVideoContainer}>
            {showModal ? (
                <div className={styles.chatRoom}>
                    <div className={styles.chatContainer}>
                        <div className={styles.chatHeader}>
                            <h2 className={styles.chatTitle}>In-meeting chat</h2>
                            <IconButton
                                className={styles.chatCloseButton}
                                onClick={() => setModal(false)}
                                aria-label='Close chat'
                            >
                                <CloseRoundedIcon />
                            </IconButton>
                        </div>

                        <div className={styles.chattingDisplay}>
                            {messages.length
                                ? messages.map((item, index) => (
                                    <div
                                        className={`${styles.messageItem} ${item.self ? styles.messageItemSelf : ''}`}
                                        key={`${item.sender}-${index}`}
                                    >
                                        <p className={styles.messageSender}>{item.self ? 'You' : item.sender}</p>
                                        <p className={styles.messageText}>{item.data}</p>
                                    </div>
                                ))
                                : <p className={styles.noMessages}>No messages yet. Say hello!</p>}
                            <div ref={chatEndRef} />
                        </div>

                        <div className={styles.chattingArea}>
                            <TextField
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                onKeyDown={handleChatKeyDown}
                                id='outlined-basic'
                                label='Type a message'
                                variant='outlined'
                                size='small'
                                autoComplete='off'
                            />
                            <Button variant='contained' onClick={sendMessage}>Send</Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className={styles.topBar}>
                <div className={styles.roomPill}>Live meeting</div>
            </div>

            <div className={styles.conferenceView}>
                {videos.map((remoteVideo) => (
                    <div className={styles.conferenceCard} key={remoteVideo.socketId}>
                        <video
                            data-socket={remoteVideo.socketId}
                            ref={(ref) => {
                                if (ref && remoteVideo.stream) {
                                    ref.srcObject = remoteVideo.stream;
                                }
                            }}
                            autoPlay
                            playsInline
                        ></video>
                        <div className={styles.participantLabel}>Participant</div>
                    </div>
                ))}
            </div>

            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted playsInline></video>

            <div className={styles.buttonContainers}>
                <IconButton onClick={handleVideo} className={styles.controlButton}>
                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton onClick={handleEndCall} className={`${styles.controlButton} ${styles.dangerButton}`}>
                    <CallEndIcon />
                </IconButton>
                <IconButton onClick={handleAudio} className={styles.controlButton}>
                    {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>

                {screenAvailable ? (
                    <IconButton onClick={handleScreen} className={styles.controlButton}>
                        {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton>
                ) : null}

                <Badge badgeContent={newMessages} max={999} color='warning'>
                    <IconButton
                        onClick={() => {
                            setModal((current) => !current);
                            setNewMessages(0);
                        }}
                        className={styles.controlButton}
                    >
                        <ChatIcon />
                    </IconButton>
                </Badge>
            </div>
        </div>
    );
}