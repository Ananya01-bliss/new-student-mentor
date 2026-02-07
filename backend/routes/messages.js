const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, messageController.sendMessage);
router.get('/conversations', auth, messageController.getConversations);
router.put('/read/:otherUserId', auth, messageController.markAsRead);
router.get('/:otherUserId', auth, messageController.getMessages);

module.exports = router;
