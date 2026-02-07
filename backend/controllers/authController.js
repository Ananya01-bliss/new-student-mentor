const { User, Student, Mentor } = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, role, name, ...otherData } = req.body;

        // Check if user exists (case-insensitive)
        let user = await User.findOne({
            email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user based on role
        if (role === 'student') {
            user = new Student({
                email,
                password: hashedPassword,
                role,
                name,
                usn: otherData.usn,
                domain: otherData.domain,
                specialization: otherData.specialization,
                year: otherData.year
            });
        } else if (role === 'mentor') {
            user = new Mentor({
                email,
                password: hashedPassword,
                role,
                name,
                maxStudents: otherData.maxStudents,
                summary: otherData.summary,
                shortDescription: otherData.shortDescription,
                projectsDone: otherData.projectsDone,
                expertise: otherData.expertise
            });
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await user.save();

        // Create JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxStudents: user.role === 'mentor' ? user.maxStudents : undefined
            }
        });

    } catch (err) {
        // Handle Duplicate Key Error (E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            const value = err.keyValue[field];
            // Format the field name for better readability
            const formattedField = field === 'usn' ? 'USN' : field.charAt(0).toUpperCase() + field.slice(1);
            return res.status(400).json({
                message: `${formattedField} '${value}' already exists.`
            });
        }

        // Handle Mongoose Validation Errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (!user) {
            return res.status(400).json({ message: 'User not registered' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Role validation
        if (role && user.role !== role) {
            return res.status(403).json({
                message: `Access denied. You are trying to log in as a ${role}, but this account is registered as a ${user.role}.`
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxStudents: user.role === 'mentor' ? user.maxStudents : undefined
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMentors = async (req, res) => {
    try {
        const mentors = await Mentor.find({}, '-password');
        res.json(mentors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
