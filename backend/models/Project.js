const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    idea: {
        type: String,
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guidanceNeeded: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0
    },
    milestones: [{
        title: { type: String, required: true },
        description: { type: String },
        dueDate: { type: Date },
        status: {
            type: String,
            enum: ['pending', 'submitted', 'completed'],
            default: 'pending'
        },
        submission: { type: String }, // Links or text
        feedback: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],
    keywords: [{ type: String }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', projectSchema);
