import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['WORKSPACE', 'DIRECT', 'GROUP'],
        default: 'GROUP',
        required: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace"
    }, // Required if type is WORKSPACE
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    name: {
        type: String,
        trim: true,
        maxlength: 100
    }, // For WORKSPACE channels or GROUP chats
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    admins: [{ // For GROUP/WORKSPACE management
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingInvites: [{ // For external invites
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
            default: 'PENDING'
        },
        invitedAt: {
            type: Date,
            default: Date.now
        }
    }],
    hiddenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ workspace: 1, type: 1 });
conversationSchema.index({ 'pendingInvites.email': 1 });

// Validation: WORKSPACE type must have workspace ID
conversationSchema.pre('save', function (next) {
    if (this.type === 'WORKSPACE' && !this.workspace) {
        next(new Error('Workspace ID is required for WORKSPACE type conversations'));
    }

    // DIRECT conversations must have exactly 2 participants
    if (this.type === 'DIRECT' && this.participants.length !== 2) {
        next(new Error('DIRECT conversations must have exactly 2 participants'));
    }

    // Ensure at least one participant
    if (!this.participants || this.participants.length === 0) {
        next(new Error('Conversation must have at least one participant'));
    }

    next();
});

export default mongoose.model("Conversation", conversationSchema);
