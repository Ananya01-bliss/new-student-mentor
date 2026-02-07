const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, projectController.createProject);
router.get('/student', auth, projectController.getStudentProjects);
router.get('/mentor/requests', auth, projectController.getMentorRequests);
router.post('/mentor/respond', auth, projectController.respondToRequest);
router.get('/mentor/mentees', auth, projectController.getMentorMentees);
router.get('/mentor/stats', auth, projectController.getMentorStats);
router.post('/mentor/complete', auth, projectController.completeMentorship);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

// Milestones
const upload = require('../middleware/uploadMiddleware');
router.post('/add-milestone', auth, projectController.addMilestone);
router.post('/submit-milestone', auth, projectController.submitMilestone);
router.post('/submit-milestone-file', auth, upload.single('file'), projectController.submitMilestoneFile);
router.post('/cancel-submission', auth, projectController.cancelSubmission);
router.post('/evaluate-milestone', auth, projectController.evaluateMilestone);

// Suggestions: specific path first to avoid :projectId capturing "suggestions"
router.get('/suggestions/by-keywords', auth, projectController.getSuggestedMentorsByQuery);
router.get('/:projectId/suggested-mentors', auth, projectController.getSuggestedMentors);
router.post('/suggestions', auth, projectController.getSuggestedMentorsByKeywords);

module.exports = router;
