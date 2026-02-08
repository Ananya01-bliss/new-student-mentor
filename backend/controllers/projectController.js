const Project = require('../models/Project');
const { Student, Mentor } = require('../models/User');
const { gatherKeywords, normalizeKeywordInput, scoreMentor } = require('../utils/keywordMatch');

    exports.createProject = async (req, res) => {
    try {
        // 1️⃣ Ensure only students can create projects
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can create projects' });
        }

        // 2️⃣ Extract data from request body
        const {
            title,
            idea,
            guidanceNeeded,
            keywords,
            mentorId
        } = req.body;

        // 3️⃣ Basic validation
        if (!title || !idea) {
            return res.status(400).json({ message: 'Title and idea are required' });
        }

        // 4️⃣ Create project WITH mentorship request
        const project = new Project({
            title,
            idea,
            guidanceNeeded,
            keywords,
            student: req.user.id,   // 🔐 from JWT
            mentor: mentorId || null,  // ⭐ ASSIGN MENTOR IF STUDENT EXPLICITLY SELECTS ONE
            status: mentorId ? 'pending' : 'draft'  // 'draft' if no mentor, 'pending' if mentor selected
        });

        // 5️⃣ Save to DB
        await project.save();

        // 6️⃣ Populate mentor info before responding
        await project.populate('mentor', 'name email');

        // 7️⃣ Respond
        res.status(201).json(project);

    } catch (error) {
        console.error('CREATE PROJECT ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStudentProjects = async (req, res) => {
    try {
        const projects = await Project.find({ student: req.user.id })
            .populate('mentor', 'name email')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMentorRequests = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const projects = await Project.find({
            mentor: mentorId,
            status: 'pending'
        }).populate('student', 'name email domain specialization');
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.respondToRequest = async (req, res) => {
    try {
        const { projectId, status } = req.body;
        const mentorId = req.user.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (status === 'approved') {
            // Check intake limit
            const mentor = await Mentor.findById(mentorId);
            const currentMenteeCount = await Project.countDocuments({
                mentor: mentorId,
                status: { $in: ['approved', 'in_progress'] }
            });

            if (currentMenteeCount >= mentor.maxStudents) {
                return res.status(400).json({
                    message: `Intake limit reached. You can only guide up to ${mentor.maxStudents} students.`
                });
            }

            project.status = 'approved';
            project.mentor = mentorId;
        } else {
            project.status = 'rejected';
        }

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMentorMentees = async (req, res) => {
    try {
        const projects = await Project.find({
            mentor: req.user.id,
            status: { $in: ['approved', 'in_progress'] }
        }).populate('student', 'name email usn domain specialization');
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProjectProgress = async (project) => {
    try {
        if (!project || !project.milestones || project.milestones.length === 0) {
            project.progress = 0;
            return project;
        }

        // Each milestone is worth 100 points
        // 'completed' = 100 points
        // 'submitted' = 50 points (immediate progress reflected)
        // 'pending' = 0 points

        const totalPoints = project.milestones.length * 100;
        let earnedPoints = 0;

        project.milestones.forEach(m => {
            if (m.status === 'completed') earnedPoints += 100;
            else if (m.status === 'submitted') earnedPoints += 50;
        });

        const progress = Math.round((earnedPoints / totalPoints) * 100);

        project.progress = progress;
        if (progress === 100) project.status = 'completed';
        else if (progress > 0) project.status = 'in_progress';

        return project;
    } catch (err) {
        console.error('Error in updateProjectProgress:', err);
        throw err;
    }
};

exports.addMilestone = async (req, res) => {
    try {
        const { projectId, title, description, dueDate } = req.body;
        console.log(`Adding milestone to project ${projectId} by mentor ${req.user.id}`);

        let parsedDate = null;
        if (dueDate) {
            // Handle various date formats (e.g., DD-MM-YYYY or YYYY-MM-DD)
            const parts = dueDate.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) { // YYYY-MM-DD
                    parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else { // DD-MM-YYYY
                    parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else {
                parsedDate = new Date(dueDate);
            }
        }

        if (dueDate && parsedDate && isNaN(parsedDate.getTime())) {
            console.error('Invalid date received:', dueDate);
            return res.status(400).json({ message: 'Invalid due date format' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return res.status(404).json({ message: 'Project not found' });
        }

        // Safety check for mentor
        if (!project.mentor || project.mentor.toString() !== req.user.id) {
            console.error('Mentor authorization failed. Project mentor:', project.mentor, 'Req user:', req.user.id);
            return res.status(401).json({ message: 'Not authorized' });
        }

        project.milestones.push({
            title,
            description,
            dueDate: parsedDate,
            status: 'pending'
        });

        await updateProjectProgress(project);
        await project.save();

        console.log('Milestone added successfully');
        res.json(project);
    } catch (err) {
        console.error('Detailed error in addMilestone:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.submitMilestone = async (req, res) => {
    try {
        const { projectId, milestoneId, submission } = req.body;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.student.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        milestone.submission = submission;
        milestone.status = 'submitted';
        milestone.updatedAt = Date.now();

        await updateProjectProgress(project);
        await project.save();
        res.json(project);
    } catch (err) {
        console.error('Detailed error in submitMilestone:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.submitMilestoneFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { projectId, milestoneId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.student.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        // Store the file path
        const fileUrl = `/uploads/${req.file.filename}`;
        milestone.submission = fileUrl;
        milestone.status = 'submitted';
        milestone.updatedAt = Date.now();

        await updateProjectProgress(project);
        await project.save();
        res.json({ project, fileUrl });
    } catch (err) {
        console.error('Detailed error in submitMilestoneFile:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.cancelSubmission = async (req, res) => {
    try {
        const { projectId, milestoneId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.student.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        if (milestone.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed milestone' });
        }

        milestone.submission = null;
        milestone.status = 'pending';
        milestone.updatedAt = Date.now();

        await updateProjectProgress(project);
        await project.save();
        res.json(project);
    } catch (err) {
        console.error('Detailed error in cancelSubmission:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.evaluateMilestone = async (req, res) => {
    try {
        const { projectId, milestoneId, status, feedback } = req.body;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (!project.mentor || project.mentor.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

        milestone.status = status; // 'completed' or 'pending' (if rejected)
        milestone.feedback = feedback;
        milestone.updatedAt = Date.now();

        await updateProjectProgress(project);
        await project.save();

        res.json(project);
    } catch (err) {
        console.error('Detailed error in evaluateMilestone:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { title, idea, guidanceNeeded } = req.body;
        const projectId = req.params.id;
        const studentId = req.user.id;

        let project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is the owner
        if (project.student.toString() !== studentId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        project = await Project.findByIdAndUpdate(
            projectId,
            { $set: { title, idea, guidanceNeeded, keywords: req.body.keywords } },
            { new: true }
        );

        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check ownership
        if (project.student.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Project.findByIdAndDelete(projectId);

        // Optional: Remove from Student's project array if you maintained that relationship
        await Student.findByIdAndUpdate(req.user.id, {
            $pull: { projects: projectId }
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSuggestedMentors = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const searchKeywords = gatherKeywords(
            project.keywords,
            project.idea,
            project.guidanceNeeded,
            project.title
        );
        if (searchKeywords.length === 0) {
            return res.json([]);
        }

        const mentors = await Mentor.find({}).select('name email summary expertise shortDescription').lean();
        const suggestedMentors = mentors
            .map(mentor => {
                const { score, matchedKeywords } = scoreMentor(mentor, searchKeywords);
                return {
                    ...mentor,
                    id: mentor._id,
                    matchScore: score,
                    matchedKeywords
                };
            })
            .filter(m => m.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json(suggestedMentors.slice(0, 10));
    } catch (err) {
        console.error('Error getting suggested mentors:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSuggestedMentorsByQuery = async (req, res) => {
    try {
        const raw = req.query.keywords || req.query.q || '';
        const searchKeywords = normalizeKeywordInput(raw);
        if (searchKeywords.length === 0) {
            return res.json([]);
        }
        const mentors = await Mentor.find({}).select('name email summary expertise shortDescription').lean();
        const suggestedMentors = mentors
            .map(mentor => {
                const { score, matchedKeywords } = scoreMentor(mentor, searchKeywords);
                return {
                    ...mentor,
                    id: mentor._id,
                    matchScore: score,
                    matchedKeywords
                };
            })
            .filter(m => m.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);
        res.json(suggestedMentors.slice(0, 10));
    } catch (err) {
        console.error('Error getSuggestedMentorsByQuery:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSuggestedMentorsByKeywords = async (req, res) => {
    try {
        const searchKeywords = normalizeKeywordInput(req.body.keywords || req.body.keyword || '');
        if (searchKeywords.length === 0) {
            return res.json([]);
        }

        const mentors = await Mentor.find({}).select('name email summary expertise shortDescription').lean();
        const suggestedMentors = mentors
            .map(mentor => {
                const { score, matchedKeywords } = scoreMentor(mentor, searchKeywords);
                return {
                    ...mentor,
                    id: mentor._id,
                    matchScore: score,
                    matchedKeywords
                };
            })
            .filter(m => m.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

        res.json(suggestedMentors.slice(0, 10));
    } catch (err) {
        console.error('Error getting suggested mentors by keywords:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.completeMentorship = async (req, res) => {
    try {
        const { projectId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.mentor || project.mentor.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        project.status = 'completed';
        project.progress = 100;
        await project.save();

        res.json(project);
    } catch (err) {
        console.error('Detailed error in completeMentorship:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

exports.getMentorStats = async (req, res) => {
    try {
        const mentorId = req.user.id;

        const activeCount = await Project.countDocuments({
            mentor: mentorId,
            status: { $in: ['approved', 'in_progress'] }
        });

        const pendingCount = await Project.countDocuments({
            mentor: mentorId,
            status: 'pending'
        });

        const completedCount = await Project.countDocuments({
            mentor: mentorId,
            status: 'completed'
        });

        res.json({
            activeMentees: activeCount,
            pendingRequests: pendingCount,
            completedProjects: completedCount
        });
    } catch (err) {
        console.error('Error fetching mentor stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
