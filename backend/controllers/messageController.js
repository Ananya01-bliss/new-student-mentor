const mongoose = require('mongoose');
const Message = require('../models/Message');
const { User } = require('../models/User');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !content || typeof content !== 'string') {
            return res.status(400).json({ message: 'receiverId and content are required' });
        }
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            return res.status(400).json({ message: 'Message content cannot be empty' });
        }

        const receiverObjId = mongoose.Types.ObjectId.isValid(receiverId) ? receiverId : null;
        if (!receiverObjId) {
            return res.status(400).json({ message: 'Invalid receiver' });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverObjId,
            content: trimmedContent
        });

        const message = await newMessage.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name role')
            .populate('receiver', 'name role')
            .lean();

        const io = req.app.get('io');
        const payload = {
            ...populatedMessage,
            id: populatedMessage._id,
            sender: { ...populatedMessage.sender, id: populatedMessage.sender._id },
            receiver: { ...populatedMessage.receiver, id: populatedMessage.receiver._id }
        };
        io.to(String(receiverObjId)).to(String(senderId)).emit('new_message', payload);

        res.status(201).json(payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
            .populate('sender', 'name role')
            .sort({ timestamp: 1 })
            .lean();

        const formatted = messages.map(m => ({
            ...m,
            id: m._id,
            sender: m.sender ? { ...m.sender, id: m.sender._id } : m.sender,
            receiver: m.receiver ? { ...m.receiver, id: m.receiver._id } : m.receiver
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ timestamp: -1 }).lean();

        const conversationIds = new Set();
        messages.forEach(msg => {
            const sid = msg.sender?.toString?.() || msg.sender;
            const rid = msg.receiver?.toString?.() || msg.receiver;
            const otherId = sid === userId ? rid : sid;
            if (otherId) conversationIds.add(otherId);
        });

        const users = await User.find({ _id: { $in: Array.from(conversationIds) } })
            .select('name role email')
            .lean();

        const enhancedConversations = await Promise.all(users.map(async (user) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: userId, receiver: user._id },
                    { sender: user._id, receiver: userId }
                ]
            }).sort({ timestamp: -1 }).select('content timestamp').lean();

            const unreadCount = await Message.countDocuments({
                sender: user._id,
                receiver: userId,
                read: false
            });

            return {
                _id: user._id,
                id: user._id,
                name: user.name,
                role: user.role,
                email: user.email,
                lastMessage: lastMsg ? lastMsg.content : '',
                lastMessageTime: lastMsg ? lastMsg.timestamp : null,
                unreadCount
            };
        }));

        enhancedConversations.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        res.json(enhancedConversations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        await Message.updateMany(
            { sender: otherUserId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
