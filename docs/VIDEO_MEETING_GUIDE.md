# Video Conferencing Guide - Collaborative Suite

This document outlines the architecture, requirements, and step-by-step plan to implement a production-ready, peer-to-peer video conferencing system within the CollabSuite platform.

## 🧠 Knowledge Prerequisites
Before building this feature, you should have a basic understanding of:

1.  **WebRTC (Web Real-Time Communication)**: The core technology allowing browsers to exchange video/audio data directly without a middle server.
2.  **Signaling**: The process of two browsers "introducing" themselves (using Socket.io) to exchange IDs (SDP - Session Description Protocol).
3.  **P2P (Peer-to-Peer)**: Understanding that video data flows directly between users, saving server bandwidth.
4.  **STUN/TURN Servers**: Servers that help browsers find their public IP addresses to bypass firewalls (we'll start with public ones).
5.  **simple-peer**: A high-level library that simplifies the complex WebRTC API into an easy-to-use "signal and stream" interface.

---

## 🛠️ Technical Requirements

### Libraries
*   **Frontend**: `simple-peer` (WebRTC), `socket.io-client` (Signaling).
*   **Backend**: `socket.io` (Signaling Server).

### Browser Permissions
*   Camera and Microphone access (`navigator.mediaDevices.getUserMedia`).

---

## 🚀 Implementation Plan

### Phase 1: Infrastructure (Signaling)
1.  **Socket.io Setup**: Create a dedicated namespace or room system in the backend where users join a meeting ID.
2.  **Signaling Handshake**: 
    *   User A joins -> User B joins.
    *   User A sends an "offer" (Signal) to B via Socket.
    *   User B receives the offer and sends back an "answer".
    *   Connection established!

### Phase 2: Core Video Logic (`VideoMeet.jsx`)
1.  **User Stream**: Capture the local video/audio feed on mount.
2.  **Peer Management**:
    *   Handle many-to-many connections (Mesh Network).
    *   Track an array of peers (connected users).
3.  **Dynamic Rendering**: Create a grid of `<video>` elements for every participant.

### Phase 3: Meeting Controls & UI
1.  **Lobby (The Waiting Room)**:
    *   A screen to toggle Camera/Mic before joining.
    *   Check if the meeting ID exists.
2.  **In-Meeting Toolbar**:
    *   Mute/Unmute Audio.
    *   Toggle Video.
    *   Share Screen.
    *   "Leave Meeting" button (cleans up socket and peer connections).

### Phase 4: Production Optimization
1.  **Active Speaker highlighing**: Using Web Audio API to detect who is talking.
2.  **Error Handling**: Handle camera-in-use errors or unexpected disconnections.
3.  **Responsive Layout**: Ensure the video grid looks beautiful on mobile.

---

## ⚠️ Important Production Gotchas (Vite Specific)
`simple-peer` uses Node.js features that don't exist in the browser. When using Vite, we MUST:
1.  Define `global` in `index.html`.
2.  Pollyfill `Buffer` or `process` if needed.
3.  Ensure the streams are properly cleaned up (unmounted) to avoid the "camera led stays on" bug.

---

## 🎯 Final Goal
A system where a user clicks "Start Meeting", gets a unique URL, shares it with 3-4 peers, and they can see/hear each other with zero lag and high-quality video.
