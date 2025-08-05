// Step 1: Zaroori packages aur environment variables ko load karna
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http'); 
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

// Step 2: Models, Routes, aur Middleware ko import karna
const Message = require('./models/Message'); // Naya Message model
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const agoraRoutes = require('./routes/agoraRoutes'); // Naya Agora route
const { protect } = require('./middleware/authMiddleware');

// App, Server, aur Socket.IO Initialization
const app = express();
const server = http.createServer(app); 
const io = new Server(server);

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB database se connection kamyab ho gaya...'))
  .catch(err => console.log('Database connection me error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agora', agoraRoutes); // Agora routes ko register karna

// Socket.IO Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});

// User ID aur Socket ID ka map
const userSockets = {};

// Real-time Communication Logic
io.on('connection', (socket) => {
    console.log(`User connect hua: ${socket.user.id} (Socket ID: ${socket.id})`);
    userSockets[socket.user.id] = socket.id;

    socket.on('privateMessage', async ({ content, toUserId }) => {
        try {
            const receiverSocketId = userSockets[toUserId];
            const message = new Message({
                sender: socket.user.id,
                receiver: toUserId,
                content: content
            });
            await message.save();

            const messageData = {
                _id: message._id,
                content: message.content,
                sender: message.sender,
                receiver: message.receiver,
                timestamp: message.createdAt
            };
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receivePrivateMessage', messageData);
            }
        } catch (error) {
            console.error('Message bhejne me error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnect hua: ${socket.user.id}`);
        for (let userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// Page Rendering Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/register', (req, res) => res.render('register', { title: 'Register' }));
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
app.get('/chat', protect, (req, res) => res.render('chat', { user: req.user }));

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server http://localhost:${PORT} par chal raha hai`));
