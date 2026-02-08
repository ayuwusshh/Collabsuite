// routes/config.js
import express from 'express';

const router = express.Router();

// Get ICE servers configuration for WebRTC
router.get('/ice-servers', (req, res) => {
    const iceServers = [
        // Public STUN servers (always available)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Add TURN server if configured
    if (process.env.TURN_SERVER_URL) {
        iceServers.push({
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || ''
        });
    }

    res.json({ iceServers });
});

export default router;
