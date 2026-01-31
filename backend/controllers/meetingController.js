import Meeting from '../models/Meeting.js';

export const createMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const meeting = await Meeting.create({
            meetingId,
            host: req.user._id,
        });
        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [
                { host: req.user._id },
                { participants: req.user._id }
            ]
        }).sort({ createdAt: -1 }).limit(10).populate('host', 'name');

        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
