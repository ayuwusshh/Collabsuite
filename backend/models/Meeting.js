import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
