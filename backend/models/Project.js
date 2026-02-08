const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
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
        ref: 'User',
        default: null
    },

    guidanceNeeded: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed'],
        default: 'draft'
    },

    progress: {
        type: Number,
        default: 0
    },

    milestones: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                default: ''
            },
            dueDate: {
                type: Date
            },
            status: {
                type: String,
                enum: ['pending', 'submitted', 'approved', 'rejected', 'in_progress', 'completed'],
                default: 'pending'
            },
            submission: {
                type: String,
                default: null
            },
            feedback: {
                type: String,
                default: ''
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    keywords: [
        {
            type: String,
            lowercase: true,
            trim: true
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
