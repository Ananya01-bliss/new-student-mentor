const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/mentors', authController.getMentors);
router.get('/:id', authController.getUserById);

module.exports = router;
