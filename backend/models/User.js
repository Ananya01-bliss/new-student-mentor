const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String, // Will hash this later
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'mentor'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { discriminatorKey: 'role', timestamps: true });

const User = mongoose.model('User', userSchema);

// Student Discriminator
const Student = User.discriminator('student', new mongoose.Schema({
    name: { type: String, required: true },
    usn: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    specialization: { type: String },
    year: { type: Number },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }] // Placeholder for future
}));

// Mentor Discriminator
const Mentor = User.discriminator('mentor', new mongoose.Schema({
    name: { type: String, required: true },
    maxStudents: { type: Number, default: 5 },
    summary: { type: String },
    shortDescription: { type: String },
    projectsDone: { type: String }, // Can be array later if needed
    expertise: [{ type: String }]
}));

module.exports = { User, Student, Mentor };
