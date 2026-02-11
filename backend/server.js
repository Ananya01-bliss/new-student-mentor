const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors({
  origin: "http://localhost:4200",
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.set('io', io);

const users = {}; // userId -> socketId

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    const uid = String(userId);
    socket.join(uid);
    users[uid] = socket.id;
  });

  socket.on('leave', (userId) => {
    const uid = String(userId);
    socket.leave(uid);
    if (users[uid] === socket.id) {
      delete users[uid];
    }
  });

  socket.on('typing', ({ userId, otherUserId }) => {
    if (otherUserId) socket.to(String(otherUserId)).emit('typing', { userId });
  });

  socket.on('stop_typing', ({ otherUserId }) => {
    if (otherUserId) socket.to(String(otherUserId)).emit('stop_typing');
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of Object.entries(users)) {
      if (sid === socket.id) {
        delete users[uid];
        break;
      }
    }
  });
});

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const messageRoutes = require('./routes/messages');
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.send('Mentor Student API is running.'));
app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentor-student-db';

function redactConnectionString(uri) {
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '(invalid uri)';
  }
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

function connectWithRetry(retriesLeft = MAX_RETRIES) {
  return mongoose.connect(mongoURI)
    .then(() => {
      console.log('MongoDB Connected');
      console.log('Database:', redactConnectionString(mongoURI));
      server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
      console.error('MongoDB Connection Error:', err.message);
      if (retriesLeft > 0) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s... (${retriesLeft} attempt(s) left)`);
        return new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          .then(() => connectWithRetry(retriesLeft - 1));
      }
      console.error('MongoDB connection failed after retries. Exiting.');
      process.exit(1);
    });
}

console.log('Connecting to MongoDB:', redactConnectionString(mongoURI));
connectWithRetry();


