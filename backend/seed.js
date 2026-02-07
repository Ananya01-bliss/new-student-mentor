const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Student, Mentor } = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentor-student-db';

const seedData = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users.');

        const salt = await bcrypt.genSalt(10);
        const commonPassword = await bcrypt.hash('password123', salt);

        // Create Mentors
        const mentors = [
            {
                name: 'Dr. Alex Smith',
                email: 'alex.smith@mentor.com',
                password: commonPassword,
                role: 'mentor',
                summary: 'Senior Software Architect with 15 years of experience in Cloud & AI.',
                expertise: ['AI', 'Cloud Computing', 'React']
            },
            {
                name: 'Sarah Miller',
                email: 'sarah.miller@mentor.com',
                password: commonPassword,
                role: 'mentor',
                summary: 'Expert Data Scientist and researcher.',
                expertise: ['Python', 'Data Science', 'Machine Learning']
            }
        ];

        for (const mData of mentors) {
            const mentor = new Mentor(mData);
            await mentor.save();
        }
        console.log('Seeded Mentors.');

        // Create Students
        const students = [
            {
                name: 'John Doe',
                email: 'john.doe@student.com',
                password: commonPassword,
                role: 'student',
                usn: '1MS21CS001',
                domain: 'Web Development',
                specialization: 'Frontend'
            },
            {
                name: 'Jane Student',
                email: 'jane@student.com',
                password: commonPassword,
                role: 'student',
                usn: '1MS21CS002',
                domain: 'Artificial Intelligence',
                specialization: 'NLP'
            }
        ];

        for (const sData of students) {
            const student = new Student(sData);
            await student.save();
        }
        console.log('Seeded Students.');

        console.log('Seeding complete! You can now log in with:');
        console.log('Email: john.doe@student.com / Password: password123');
        console.log('Email: alex.smith@mentor.com / Password: password123');

        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
