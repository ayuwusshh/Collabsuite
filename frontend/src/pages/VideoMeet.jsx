import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, Users, Monitor, MonitorOff, MessageSquare, Pin } from 'lucide-react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import MeetingSidePanel from '../components/MeetingSidePanel';
import api from '../services/api';

const VideoMeet = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]); // [{ peerID, peer, stream }]
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [pinnedPeer, setPinnedPeer] = useState(null); // 'self' or peerID
    const [isHost, setIsHost] = useState(false);
    const [hasAudioPermission, setHasAudioPermission] = useState(true);
    const [hasVideoPermission, setHasVideoPermission] = useState(true);
    const [iceServers, setIceServers] = useState([{ urls: 'stun:stun.l.google.com:19302' }]);

    // Refs
    const userVideo = useRef();
    const userVideoSecondary = useRef(); // For pinned sidebar view
    const socketRef = useRef();
    const peersRef = useRef([]); // To keep track for signaling without re-renders
    const screenStreamRef = useRef(null);

    // Fetch ICE servers configuration
    useEffect(() => {
        const fetchIceServers = async () => {
            try {
                const response = await api.get('/config/ice-servers');
                if (response.data.iceServers) {
                    setIceServers(response.data.iceServers);
                }
            } catch (error) {
                console.error('Failed to fetch ICE servers, using defaults:', error);
            }
        };
        fetchIceServers();
    }, []);

    // Setup local media on mount
    useEffect(() => {
        const setupMedia = async () => {
            // Try to get both audio and video
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setStream(currentStream);
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                }
                return; // Success, exit
            } catch (error) {
                console.log('Could not get both audio and video:', error.name);
            }

            // Try video only
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(videoStream);
                setHasAudioPermission(false);
                setAudioEnabled(false);
                if (userVideo.current) {
                    userVideo.current.srcObject = videoStream;
                }
                console.log('Started with video only (no mic permission)');
                return; // Success with video only
            } catch (error) {
                console.log('Could not get video:', error.name);
                setHasVideoPermission(false);
            }

            // Try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setStream(audioStream);
                setHasVideoPermission(false);
                setVideoEnabled(false);
                console.log('Started with audio only (no camera permission)');
                return; // Success with audio only
            } catch (error) {
                console.log('Could not get audio:', error.name);
                setHasAudioPermission(false);
            }

            // No permissions at all - still allow joining but with no media
            console.log('No media permissions granted');
        };
        setupMedia();

        // Handle browser back button
        const handlePopState = () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };

        // Handle tab/window close
        const handleBeforeUnload = () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
            if (socketRef.current) socketRef.current.disconnect();
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Ensure video elements always have the stream
    useEffect(() => {
        if (stream) {
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
            if (userVideoSecondary.current) {
                userVideoSecondary.current.srcObject = stream;
            }
        }
    }, [stream, isJoined, pinnedPeer]);

    const joinMeeting = () => {
        if (!stream) {
            alert('Please wait for camera to initialize');
            return;
        }

        setIsJoined(true);

        // Ensure video element has the stream
        if (userVideo.current && stream) {
            userVideo.current.srcObject = stream;
        }

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current = socket;

        socket.emit('join-room', `meet_${id}`, user?.name || 'Anonymous');

        // Listen for host status
        socket.on('you-are-host', () => {
            setIsHost(true);
        });

        // Listen for meeting ended by host
        socket.on('meeting-ended', () => {
            alert('The host has ended the meeting.');
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(({ peer }) => peer.destroy());
            navigate('/dashboard/meetings', { replace: true });
        });

        socket.on('user-joined', (userInfo) => {
            // We just log it and wait for their signal to initiate the connection
            console.log('👤 Existing user: User joined', userInfo.name);
            // We store their name in a temporary map if we need it
        });

        socket.on('all-users', (users) => {
            const peers = [];
            users.forEach(userInfo => {
                const peer = createPeer(userInfo.socketId, socket.id, stream); // Use createPeer for initial connection
                peersRef.current.push({
                    peerID: userInfo.socketId,
                    peer,
                    name: userInfo.name
                });
                peers.push({ peerID: userInfo.socketId, peer, name: userInfo.name });
            });
            setPeers(peers);
        });

        socket.on('signal', ({ signal, from, name }) => {
            const item = peersRef.current.find(p => p.peerID === from);
            if (item) {
                item.peer.signal(signal);
            } else {
                // If peer not found, this is an incoming call (we are the receiver)
                const peer = addPeer(signal, from, stream);
                peersRef.current.push({
                    peerID: from,
                    peer,
                    name: name || 'Anonymous'
                });
                setPeers(prev => {
                    const updated = [...prev, { peerID: from, peer, name: name || 'Anonymous' }];
                    return updated;
                });
            }
        });

        socket.on('user-left', (userId) => {
            const peerObj = peersRef.current.find(p => p.peerID === userId);
            if (peerObj) peerObj.peer.destroy();

            peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
            setPeers(prev => prev.filter(p => p.peerID !== userId));

            // Unpin if pinned peer left
            if (pinnedPeer === userId) {
                setPinnedPeer(null);
            }
        });
    };

    const createPeer = (userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: iceServers
            }
        });

        peer.on('signal', signal => {
            socketRef.current.emit('signal', { to: userToSignal, signal });
        });

        peer.on('stream', remoteStream => {
        });

        peer.on('error', err => {
        });

        return peer;
    };

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: iceServers
            }
        });

        peer.on('signal', signal => {
            socketRef.current.emit('signal', { to: callerID, signal });
        });

        peer.on('stream', remoteStream => {
        });

        peer.on('error', err => {
        });

        peer.signal(incomingSignal);
        return peer;
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });

                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track in current stream
                const videoTrack = stream.getVideoTracks()[0];
                stream.removeTrack(videoTrack);
                stream.addTrack(screenTrack);

                // Update peers with new track
                peersRef.current.forEach(({ peer }) => {
                    peer.replaceTrack(
                        videoTrack,
                        screenTrack,
                        stream
                    );
                });

                // Update local video
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }

                setIsScreenSharing(true);

                // Handle when user stops sharing via browser UI
                screenTrack.onended = () => {
                    stopScreenShare();
                };
            } catch (error) {
                if (error.name !== 'NotAllowedError') {
                    alert('Failed to start screen sharing');
                }
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Get camera back
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newVideoTrack = videoStream.getVideoTracks()[0];
            const oldTrack = stream.getVideoTracks()[0];

            stream.removeTrack(oldTrack);
            stream.addTrack(newVideoTrack);

            // Update peers
            peersRef.current.forEach(({ peer }) => {
                peer.replaceTrack(
                    oldTrack,
                    newVideoTrack,
                    stream
                );
            });

            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }

            setIsScreenSharing(false);
        } catch (error) {
            // Error restoring camera
        }
    };

    const toggleAudio = () => {
        if (!hasAudioPermission) {
            alert('Microphone access was denied. Please enable it in your browser settings (click the lock icon in the address bar).');
            return;
        }
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioEnabled;
                setAudioEnabled(!audioEnabled);
            }
        }
    };

    const toggleVideo = () => {
        if (!hasVideoPermission) {
            alert('Camera access was denied. Please enable it in your browser settings (click the lock icon in the address bar).');
            return;
        }
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoEnabled;
                setVideoEnabled(!videoEnabled);
            }
        }
    };

    const leaveMeeting = () => {
        // Stop all local media tracks (camera and microphone)
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }

        // Stop screen sharing if active
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Destroy all peer connections
        peersRef.current.forEach(({ peer }) => {
            peer.destroy();
        });
        peersRef.current = [];
        setPeers([]);

        // If host is leaving, end meeting for everyone
        if (isHost && socketRef.current) {
            socketRef.current.emit('end-meeting', `meet_${id}`);
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Navigate back to meetings page and replace history entry
        navigate('/dashboard/meetings', { replace: true });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (currentMessage.trim() && socketRef.current) {
            const message = {
                text: currentMessage,
                sender: user?.name || 'Anonymous',
                timestamp: new Date().toISOString()
            };

            socketRef.current.emit('send-message', {
                roomId: `meet_${id}`,
                message
            });

            // Add to local messages
            setMessages(prev => [...prev, message]);
            setCurrentMessage('');
        }
    };

    const copyMeetingId = () => {
        // Copy only the meeting ID/code
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isJoined) {
        return (
            <div className="h-full flex flex-col bg-gradient-to-br from-[#0B1220] via-[#0f1829] to-[#0B1220] text-white">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/30">
                    <button
                        onClick={() => navigate('/dashboard/meetings', { replace: true })}
                        className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back to Meetings</span>
                    </button>
                    <h1 className="text-lg font-semibold text-white">Welcome back, {user?.name || 'User'}!</h1>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-3xl w-full">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Ready to join?</h2>
                            <p className="text-sm text-gray-400">Check your camera and microphone before joining</p>
                        </div>

                        {/* Video Preview Card */}
                        <div className="bg-[#1a2332]/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-6 shadow-2xl mb-6">
                            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
                                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />

                                {!videoEnabled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/95 to-gray-800/95">
                                        <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
                                            <VideoOff className="w-10 h-10 text-gray-500" />
                                        </div>
                                        <p className="text-sm text-gray-400">Camera is off</p>
                                    </div>
                                )}

                                {/* Control Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={toggleAudio}
                                            className={`p-3.5 rounded-full transition-all shadow-lg ${audioEnabled
                                                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'
                                                : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                        >
                                            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={toggleVideo}
                                            className={`p-3.5 rounded-full transition-all shadow-lg ${videoEnabled
                                                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'
                                                : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                        >
                                            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Status Indicators */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    {!audioEnabled && (
                                        <div className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                            <MicOff className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Muted</span>
                                        </div>
                                    )}
                                    {!videoEnabled && (
                                        <div className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                            <VideoOff className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Camera Off</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={joinMeeting}
                                disabled={!stream}
                                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Video className="w-5 h-5" />
                                Join Meeting
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/meetings', { replace: true })}
                                className="px-6 py-3.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Meeting Info */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                Meeting ID: <span className="text-gray-400 font-mono">{id}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0B1220] text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-[#1a2332]/50 backdrop-blur-md border-b border-gray-800/50">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-white tracking-wide">
                                <span className="hidden sm:inline">Work Meeting</span>
                                <span className="sm:hidden">Meeting</span>
                            </h2>
                            {isHost && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-[10px] text-yellow-400 font-medium">
                                    👑 Host
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[10px] sm:text-xs text-slate-400">
                                {peers.length + 1} <span className="hidden sm:inline">People</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <button onClick={copyMeetingId} className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm transition-all border border-blue-500/30">
                        {copied ? <><Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" /> <span className="hidden sm:inline">Copied!</span></> : <><Copy className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" /> <span className="hidden sm:inline">Copy Invite</span></>}
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-[#0B1220] to-[#0f1829]">
                {pinnedPeer ? (
                    // Pinned Layout
                    <div className="h-full flex gap-4">
                        {/* Pinned Video (Large) */}
                        <div className="flex-1">
                            {pinnedPeer === 'self' ? (
                                <div className="relative h-full bg-slate-900/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-blue-500/50 group">
                                    <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-xs font-medium border border-white/10">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        You (Pinned)
                                    </div>
                                    <button
                                        onClick={() => setPinnedPeer(null)}
                                        className="absolute top-4 right-4 p-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg transition-all"
                                        title="Unpin"
                                    >
                                        <Pin className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <PeerVideo
                                    key={pinnedPeer}
                                    peer={peers.find(p => p.peerID === pinnedPeer)?.peer}
                                    name={peers.find(p => p.peerID === pinnedPeer)?.name || 'Anonymous'}
                                    index={peers.findIndex(p => p.peerID === pinnedPeer) + 1}
                                    isPinned={true}
                                    onUnpin={() => setPinnedPeer(null)}
                                />
                            )}
                        </div>

                        {/* Sidebar with other videos */}
                        <div className="w-48 md:w-64 flex flex-col gap-3 overflow-y-auto">
                            {pinnedPeer !== 'self' && (
                                <div
                                    className="relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-gray-700/30 group cursor-pointer hover:border-blue-500/50 transition-all"
                                    onClick={() => setPinnedPeer('self')}
                                >
                                    <video ref={userVideoSecondary} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium">
                                        You
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Pin className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                            {peers.filter(p => p.peerID !== pinnedPeer).map((peer, index) => (
                                <div
                                    key={peer.peerID}
                                    className="relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-gray-700/30 cursor-pointer hover:border-blue-500/50 transition-all"
                                    onClick={() => setPinnedPeer(peer.peerID)}
                                >
                                    <PeerVideo peer={peer.peer} name={peer.name || 'Anonymous'} index={index + 1} isSmall={true} onPin={() => setPinnedPeer(peer.peerID)} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Normal Grid Layout
                    <div className="h-full flex items-center justify-center">
                        <div className={`w-full grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 ${peers.length === 0
                            ? 'grid-cols-1 max-w-4xl'
                            : peers.length === 1
                                ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl'
                                : peers.length === 2
                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl'
                                    : peers.length === 3
                                        ? 'grid-cols-2 lg:grid-cols-4 max-w-7xl'
                                        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl'
                            }`}>
                            {/* User's Video */}
                            <div
                                className="relative aspect-video bg-slate-900/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-gray-700/30 group cursor-pointer hover:border-blue-500/50 transition-all"
                                onClick={() => setPinnedPeer('self')}
                            >
                                <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-2 sm:left-3 lg:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border border-white/10">
                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></span>
                                    <span className="hidden sm:inline">You</span>
                                    <span className="sm:hidden">Me</span>
                                </div>
                                {/* Pin indicator on hover */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/80 rounded-lg">
                                        <Pin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Click to Pin</span>
                                    </div>
                                </div>
                                {!audioEnabled && (
                                    <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 p-1 sm:p-1.5 bg-red-500/20 backdrop-blur-md rounded-md sm:rounded-lg border border-red-500/50">
                                        <MicOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                    </div>
                                )}
                                {!videoEnabled && (
                                    <div className="absolute top-2 sm:top-3 lg:top-4 right-10 sm:right-12 lg:right-16 p-1 sm:p-1.5 bg-red-500/20 backdrop-blur-md rounded-md sm:rounded-lg border border-red-500/50">
                                        <VideoOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                                    </div>
                                )}
                            </div>

                            {/* Peer Videos */}
                            {peers.map((peer, index) => (
                                <PeerVideo
                                    key={peer.peerID}
                                    peer={peer.peer}
                                    name={peer.name || 'Anonymous'}
                                    index={index + 1}
                                    onPin={() => setPinnedPeer(peer.peerID)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 bg-[#1a2332]/80 backdrop-blur-xl border-t border-gray-800/50">
                <div className="hidden md:flex items-center gap-2 text-slate-400">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white uppercase">
                        {id.substring(0, 2)}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mx-auto md:mx-0">
                    <button onClick={toggleAudio} className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl transition-all shadow-lg ${audioEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}`}>
                        {audioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                    </button>
                    <button onClick={toggleVideo} className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl transition-all shadow-lg ${videoEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}`}>
                        {videoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                    </button>
                    <button
                        onClick={toggleScreenShare}
                        className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl transition-all shadow-lg ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                    >
                        {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                    </button>
                    <button onClick={leaveMeeting} className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 sm:gap-3 font-semibold sm:font-bold group text-xs sm:text-sm md:text-base">
                        <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-active:scale-95 transition-transform" />
                        <span className="hidden sm:inline">End Meeting</span>
                        <span className="sm:hidden">End</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-3 rounded-xl transition-all shadow-lg ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                        title="Chat"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Side Panel */}
            <MeetingSidePanel
                socket={socketRef.current}
                roomId={`meet_${id}`}
                user={user}
                onClose={() => setShowChat(false)}
                isOpen={showChat}
            />
        </div>
    );
};

const PeerVideo = ({ peer, name = 'Anonymous', index, isPinned = false, isSmall = false, onPin, onUnpin }) => {
    const [remoteStream, setRemoteStream] = useState(null);
    const videoRef = useCallback((node) => {
        if (node && remoteStream) {
            node.srcObject = remoteStream;
            node.play().catch(err => console.log('Video play error:', err));
        }
    }, [remoteStream]);

    useEffect(() => {
        if (!peer) return;

        const handleStream = (stream) => {
            console.log("🎥 PeerVideo received stream for peer", index, stream);
            console.log("🎥 Stream tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
            setRemoteStream(stream);
        };

        const handleError = (err) => {
            console.error("Peer video error:", err);
        };

        const handleConnect = () => {
            console.log("🤝 Peer connected:", index);
        };

        peer.on('stream', handleStream);
        peer.on('error', handleError);
        peer.on('connect', handleConnect);

        // Check if stream already exists on the peer
        if (peer._remoteStreams && peer._remoteStreams.length > 0) {
            setRemoteStream(peer._remoteStreams[0]);
        }

        return () => {
            peer.off('stream', handleStream);
            peer.off('error', handleError);
            peer.off('connect', handleConnect);
        };
    }, [peer, index]);

    // Small sidebar view
    if (isSmall) {
        return (
            <>
                {remoteStream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-400">{name.substring(0, 2).toUpperCase()}</span>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium">
                    {name}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pin className="w-5 h-5" />
                </div>
            </>
        );
    }

    // Pinned (large) view
    if (isPinned) {
        return (
            <div className="relative h-full bg-slate-900/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-blue-500/50 group">
                {remoteStream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-4xl font-bold text-slate-400">{name.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <p className="text-sm text-slate-500">Connecting...</p>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-xs font-medium border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                    {name} (Pinned)
                </div>
                {onUnpin && (
                    <button
                        onClick={onUnpin}
                        className="absolute top-4 right-4 p-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg transition-all"
                        title="Unpin"
                    >
                        <Pin className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    // Normal grid view
    return (
        <div
            className="relative aspect-video bg-slate-900/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-gray-700/30 group cursor-pointer hover:border-blue-500/50 transition-all"
            onClick={onPin}
        >
            {remoteStream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl font-bold text-slate-400">{name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-slate-500">Connecting...</p>
                    </div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-2 sm:left-3 lg:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border border-white/10">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${remoteStream ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{name.substring(0, 10)}{name.length > 10 ? '...' : ''}</span>
            </div>
            {/* Pin indicator on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/80 rounded-lg">
                    <Pin className="w-4 h-4" />
                    <span className="text-sm font-medium">Click to Pin</span>
                </div>
            </div>
        </div>
    );
};

export default VideoMeet;
